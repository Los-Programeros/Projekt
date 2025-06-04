import subprocess, sys, pathlib, shutil

if len(sys.argv) != 2:
    print("Usage: python run.py <directory>")
    sys.exit(1)

root_dir = pathlib.Path(sys.argv[1])
if not root_dir.exists():
    print(f"Error: Directory '{root_dir}' does not exist")
    sys.exit(1)

scripts = [
    "PripravaPodatkov.py",
    "Predprocesiranje.py",
    "Augmentacija.py",
]

for script in scripts:
    path = pathlib.Path(script)
    if not path.exists():
        print(f"[!] {script} not found – skipping.")
        continue
    print(f"\n=== Running {script} ===")
    result = subprocess.run([sys.executable, script, str(root_dir)])
    if result.returncode != 0:
        print(f"[!] {script} exited with code {result.returncode}. Stopping.")
        sys.exit(result.returncode)
print("\nAll scripts completed.")