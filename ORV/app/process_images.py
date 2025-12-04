import subprocess, sys, pathlib

if len(sys.argv) != 2:
    print("Usage: python process_images.py <directory>")
    sys.exit(1)

root_dir = pathlib.Path(sys.argv[1]).resolve()
if not root_dir.exists():
    print(f"Error: Directory '{root_dir}' does not exist")
    sys.exit(1)

print(f"\n=== Running Predprocesiranje.py ===")
result = subprocess.run([sys.executable, "Predprocesiranje.py", str(root_dir)])
if result.returncode != 0:
    print(f"[!] Predprocesiranje.py exited with code {result.returncode}. Stopping.")
    sys.exit(result.returncode)

print(f"\n=== Running Augmentacija.py with MPI ===")
result = subprocess.run(["mpiexec", "-n", "4", sys.executable, "Augmentacija.py", str(root_dir)])
if result.returncode != 0:
    print(f"[!] Augmentacija.py exited with code {result.returncode}. Stopping.")
    sys.exit(result.returncode)

print("\nAll scripts completed.")