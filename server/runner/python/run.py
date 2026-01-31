import sys

try:
    # stdin set karo
    sys.stdin = open("/code/input.txt", "r")

    # user code read + run
    with open("/code/code.py", "r") as f:
        code = f.read()

    exec(code, {})

except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)
