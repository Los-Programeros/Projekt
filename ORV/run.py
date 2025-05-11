import subprocess, sys, pathlib

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
    result = subprocess.run([sys.executable, script])
    if result.returncode != 0:
        print(f"[!] {script} exited with code {result.returncode}. Stopping.")
        sys.exit(result.returncode)
print("\nAll scripts completed.")
