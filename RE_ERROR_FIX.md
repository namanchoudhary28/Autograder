# Runtime Error (RE) Fix - December 26, 2025

## Problem

Submission `694da7a3538f7f18ef5b75dd` was getting **RE (Runtime Error)** status even though the code was correct.

### Submission Details
- **Problem**: Two Sum
- **Language**: JavaScript
- **Status**: RE ❌ (Should be AC)
- **Code**: Valid solution that reads from `/code/input.txt`

### Expected Behavior
```javascript
// Test Case 1: input: "2 7\n9\n"
// Expected output: "0 1"
```

## Root Cause

The Docker image (`js-runner`) was **outdated** and didn't contain the updated `run.js` that:
1. Creates and reads from `/code/input.txt`
2. Pushes input to `process.stdin` for the user code

### Evidence

**Old run.js in Docker image** (incorrect):
```javascript
try {
  require("/code/code.js");  // ❌ No input handling!
  process.exit(0);
} catch (err) {
  console.error(err.toString());
  process.exit(1);
}
```

**Updated run.js in source** (correct):
```javascript
try {
  if (!fs.existsSync("/code/code.js")) {
    throw new Error("code.js not found");
  }

  const input = fs.readFileSync("/code/input.txt", "utf8"); // ✓
  process.stdin.push(input);  // ✓
  process.stdin.push(null);   // ✓

  delete require.cache[require.resolve("/code/code.js")];
  require("/code/code.js");

  process.exit(0);
} catch (err) {
  console.error(err.toString());
  process.exit(1);
}
```

## What Happened

1. User submitted code that reads from `/code/input.txt`
2. `dockerJudge.service.js` created `input.txt` file ✓
3. Docker container ran with **old** `run.js` that doesn't handle input ❌
4. User code threw error: `ENOENT: no such file or directory, open '/code/input.txt'`
5. Exit code 1 → Status marked as RE

## Solution

**Rebuild the Docker image** with the updated `run.js`:

```bash
cd /home/naman/autograder/server/runner
docker build -t js-runner .
```

## Verification

### Test Case 1
```bash
$ echo -e "2 7\n9\n" > input.txt
$ docker run --rm -v $(pwd):/code js-runner
0 1  ✓
```

### Test Case 2
```bash
$ echo -e "3 2 4\n6\n" > input.txt
$ docker run --rm -v $(pwd):/code js-runner
1 2  ✓
```

### Test Case 3
```bash
$ echo -e "3 3\n6\n" > input.txt
$ docker run --rm -v $(pwd):/code js-runner
0 1  ✓
```

## Important Note

**Always rebuild the Docker image after modifying `run.js`!**

The Docker image is a **snapshot** of the code at build time. Changes to source files don't automatically reflect in the container unless you rebuild.

### Quick Check Command
```bash
# See what run.js is actually in the Docker image
docker run --rm js-runner cat /app/run.js
```

## Files Involved

1. **`/server/runner/run.js`** - Updated to handle input.txt
2. **`/server/runner/Dockerfile`** - Copies run.js into image
3. **`/server/src/components/services/dockerJudge.service.js`** - Creates input.txt file

## Resubmit Instructions

To test the fixed submission:

1. **Rebuild Docker image** (already done ✓)
2. **Resubmit the code** through the API or UI
3. **Verify status changes** from RE → AC

The same code that got RE should now get **AC (Accepted)** status.

---

**Fixed Date**: December 26, 2025  
**Fixed By**: GitHub Copilot  
**Status**: ✅ Resolved
