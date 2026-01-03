from flask import Flask, request, jsonify
import os
import subprocess
import pathlib
import shutil
import uuid
import traceback
import sys

app = Flask(__name__)

sys.stdout.reconfigure(line_buffering=True)

WORK_DIR = "/app/work"
SCRIPTS_DIR = "/app/scripts"

os.makedirs(WORK_DIR, exist_ok=True)

def parse_hostfile(hostfile_path):
    hosts = []
    total_slots = 0

    if not os.path.exists(hostfile_path):
        return [], 0

    with open(hostfile_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            parts = line.split()
            hostname = parts[0]
            slots = 2
            port = None

            for part in parts[1:]:
                if 'slots=' in part:
                    slots = int(part.split('=')[1])
                elif 'port=' in part:
                    port = int(part.split('=')[1])

            hosts.append((hostname, slots, port))
            total_slots += slots

    return hosts, total_slots

@app.route("/process", methods=["POST"])
def process_images():
    print("[MPI-SERVICE] Processing request", flush=True)
    
    try:
        if 'images' not in request.files:
            return jsonify({"success": False, "error": "No images provided"}), 400
        
        files = request.files.getlist('images')
        job_id = str(uuid.uuid4())
        job_dir = os.path.join(WORK_DIR, job_id)
        os.makedirs(job_dir, exist_ok=True)
        
        image_count = 0
        for file in files:
            if file.filename:
                filepath = os.path.join(job_dir, f"input_{image_count}.jpg")
                file.save(filepath)
                image_count += 1
        
        print(f"[MPI-SERVICE] Saved {image_count} images", flush=True)
        
        preproc_script = os.path.join(SCRIPTS_DIR, "Predprocesiranje.py")
        
        if not os.path.exists(preproc_script):
            return jsonify({"success": False, "error": f"Preprocessing script not found"}), 500
        
        result = subprocess.run(
            ["python3", preproc_script, job_dir],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"[MPI-SERVICE] Preprocessing failed: {result.stderr}", flush=True)
            return jsonify({"success": False, "error": f"Preprocessing failed: {result.stderr}"}), 500
        
        print("[MPI-SERVICE] Starting augmentation", flush=True)
        hostfile = os.path.join(SCRIPTS_DIR, "hostfile")
        hosts, total_slots = parse_hostfile(hostfile)
        
        aug_script = os.path.join(SCRIPTS_DIR, "Augmentacija.py")
        if not os.path.exists(aug_script):
            return jsonify({"success": False, "error": f"Augmentation script not found"}), 500
        
        if total_slots == 0:
            total_slots = 2
            mpi_cmd = [
                "mpiexec",
                "-n", str(total_slots),
                "--allow-run-as-root",
                "python3",
                aug_script,
                job_dir
            ]
        else:
            print(f"[MPI-SERVICE] Using {total_slots} processes across {len(hosts)} hosts", flush=True)
            temp_hostfile = "/tmp/mpi_hostfile"
            with open(temp_hostfile, 'w') as f:
                for hostname, slots, port in hosts:
                    if port:
                        f.write(f"{hostname} slots={slots} port={port}\n")
                    else:
                        f.write(f"{hostname} slots={slots}\n")
            
            mpi_cmd = [
                "mpiexec",
                "-n", str(total_slots),
                "--hostfile", temp_hostfile,
                "--allow-run-as-root",
                "--mca", "btl_tcp_if_include", "tailscale0",
                "--mca", "oob_tcp_if_include", "tailscale0",
                "--mca", "plm_rsh_args", "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=no",
                "--mca", "orte_base_help_aggregate", "0",
                "-x", "PATH=/usr/local/bin:/usr/bin:/bin",
                "-x", "LD_LIBRARY_PATH=/usr/local/lib:/usr/lib",
                "python3",
                aug_script,
                job_dir
            ]
        
        result = subprocess.run(mpi_cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"[MPI-SERVICE] Augmentation failed: {result.stderr}", flush=True)
            return jsonify({"success": False, "error": f"Augmentation failed: {result.stderr}"}), 500
        
        processed_images = []
        for filename in os.listdir(job_dir):
            if filename.endswith('.jpg'):
                filepath = os.path.join(job_dir, filename)
                processed_images.append(filepath)
        
        print(f"[MPI-SERVICE] Created {len(processed_images)} processed images", flush=True)
        
        return jsonify({
            "success": True,
            "job_id": job_id,
            "image_count": len(processed_images)
        })
        
    except Exception as e:
        print(f"[MPI-SERVICE] Error: {str(e)}", flush=True)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/retrieve/<job_id>", methods=["GET"])
def retrieve_images(job_id):
    try:
        job_dir = os.path.join(WORK_DIR, job_id)
        
        if not os.path.exists(job_dir):
            return jsonify({"success": False, "error": "Job not found"}), 404
        
        import tarfile
        import io
        
        tar_buffer = io.BytesIO()
        with tarfile.open(fileobj=tar_buffer, mode='w:gz') as tar:
            for filename in os.listdir(job_dir):
                if filename.endswith('.jpg'):
                    filepath = os.path.join(job_dir, filename)
                    tar.add(filepath, arcname=filename)
        
        tar_buffer.seek(0)
        
        print(f"[MPI-SERVICE] Returning images for job {job_id}", flush=True)
        
        shutil.rmtree(job_dir)
        
        return tar_buffer.getvalue(), 200, {
            'Content-Type': 'application/gzip',
            'Content-Disposition': f'attachment; filename={job_id}.tar.gz'
        }
    except Exception as e:
        print(f"[MPI-SERVICE] Retrieve error: {str(e)}", flush=True)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    print("[MPI-SERVICE] Starting on port 5001", flush=True)
    
    scripts = ["Predprocesiranje.py", "Augmentacija.py"]
    for script in scripts:
        script_path = os.path.join(SCRIPTS_DIR, script)
        exists = "✓" if os.path.exists(script_path) else "✗"
        print(f"[MPI-SERVICE] {exists} {script}", flush=True)
    
    mpiexec_check = subprocess.run(["which", "mpiexec"], capture_output=True, text=True)
    if mpiexec_check.returncode == 0:
        print(f"[MPI-SERVICE] mpiexec found", flush=True)
    else:
        print(f"[MPI-SERVICE] mpiexec not found", flush=True)
    
    app.run(host="0.0.0.0", port=5001)