import os
import sys
import time
import subprocess
import urllib.request
import urllib.error
import json

def test_live_fastapi():
    print("Starting uvicorn server in subprocess...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8008"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    try:
        # Wait for server to come up
        started = False
        for _ in range(15):
            time.sleep(1)
            try:
                with urllib.request.urlopen("http://127.0.0.1:8008/api/health", timeout=2) as response:
                    if response.status == 200:
                        data = json.loads(response.read().decode())
                        print("Health check response:", data)
                        started = True
                        break
            except Exception:
                pass

        if not started:
            raise RuntimeError("Server did not respond to health check in time.")

        print("Testing Static Files Mounts...")
        # Check datasets mount
        with urllib.request.urlopen("http://127.0.0.1:8008/datasets/reference_scans/LIDC-IDRI-0078.png", timeout=2) as r:
            assert r.status == 200
            print(f"Datasets static mount verified (Status {r.status}, Content-Length: {len(r.read())} bytes)")

        print("LIVE FASTAPI SERVER TEST PASSED 100%!")
    finally:
        print("Stopping uvicorn server...")
        proc.terminate()
        proc.wait(timeout=5)

if __name__ == "__main__":
    test_live_fastapi()

