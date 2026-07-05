import subprocess
import sys

def run_script(name):
    print(f"\n============================================================")
    print(f" RUNNING SUITE: {name}")
    print(f"============================================================")
    res = subprocess.run([sys.executable, name], capture_output=False)
    if res.returncode != 0:
        print(f"\n❌ SUITE FAILED: {name}")
        sys.exit(res.returncode)
    else:
        print(f"\n✅ SUITE PASSED: {name}")

def main():
    print("ThreatMatrix Authentication, Authorization & Operations Validation Suite\n")
    run_script("test_users_endpoints.py")
    run_script("test_settings_endpoints.py")
    run_script("test_simulation.py")
    print("\n============================================================")
    print(" 🎉 ALL STACK SYSTEM INTEGRATION TESTS COMPLETED SUCCESSFULLY!")
    print("============================================================")

if __name__ == '__main__':
    main()
