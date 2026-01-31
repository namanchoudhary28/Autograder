# Docker Volume Mount Issue - Fix Documentation

## Problem Description

The autograder backend was experiencing issues when running user-submitted JavaScript code inside Docker containers. The symptoms were:

1. **Error**: "Cannot find module '/code/code.js'"
2. **Behavior**: Containers would either fail immediately or get stuck in RUNNING state
3. **Inconsistency**: Manual `docker run` commands sometimes worked, but backend-triggered runs consistently failed

## Root Cause Analysis

### Initial Setup
```javascript
// Backend code
const dir = path.join("/tmp", submissionId.toString());
fs.writeFileSync(path.join(dir, "code.js"), code);

// Docker command
docker run --rm -v /tmp/<submissionId>:/code js-runner
```

### Investigation Steps

1. **File existence verified on host**:
   ```bash
   $ ls -la /tmp/694d9a62e15b786a95a51a22/
   total 20
   -rw-rw-r--  1 naman naman  20 Dec 26 01:41 code.js  ✓ File exists
   ```

2. **Volume mount appeared empty in container**:
   ```bash
   $ docker run --rm -v /tmp/694d9a62e15b786a95a51a22:/code js-runner ls -la /code/
   total 8
   drwxr-xr-x    2 root     root  4096 Dec 25 20:11 .
   drwxr-xr-x    1 root     root  4096 Dec 25 20:32 ..
   # No code.js file! ✗
   ```

3. **Timestamp mismatch detected**:
   - Host file created: `Dec 26 01:41`
   - Container shows directory: `Dec 25 20:11`
   - The container was seeing a stale/cached version of the directory

4. **Testing with different directories**:
   ```bash
   # /tmp directory - FAILED
   $ docker run --rm -v /tmp/test:/code js-runner
   Error: code.js not found ✗
   
   # Home directory - SUCCESS
   $ docker run --rm -v ~/docker-test:/code js-runner
   SUCCESS ✓
   ```

### Root Cause: Docker Desktop `/tmp` Mount Issue

**Docker Desktop on Linux** has known issues with mounting `/tmp` directories:
- Volume mounts from `/tmp` appear empty or show stale cached content inside containers
- This is a limitation of how Docker Desktop handles temporary filesystems on Linux
- The issue doesn't occur with directories under the user's home directory

## Solution

### Changed Submission Directory Location

**Before** (broken):
```javascript
const dir = path.join("/tmp", submissionId.toString());
```

**After** (fixed):
```javascript
const os = require("os");
const baseDir = path.join(os.homedir(), ".autograder", "submissions");
const dir = path.join(baseDir, submissionId.toString());
```

### Additional Improvements Made

1. **Added file existence check in `run.js`**:
   ```javascript
   if (!fs.existsSync("/code/code.js")) {
     console.error("Error: code.js not found");
     process.exit(1);
   }
   ```

2. **Added timeout protection in backend**:
   ```javascript
   const timeout = setTimeout(() => {
     if (!resolved) {
       resolved = true;
       docker.kill();
       resolve({ status: "TLE", output: "Time limit exceeded" });
     }
   }, 5000);
   ```

3. **Added error event handler**:
   ```javascript
   docker.on("error", (err) => {
     if (!resolved) {
       resolved = true;
       clearTimeout(timeout);
       resolve({ status: "RE", output: err.toString() });
     }
   });
   ```

## Verification

### Test with Original Submission
```bash
$ mkdir -p ~/.autograder/submissions/694d9a62e15b786a95a51a22
$ echo "console.log('hello')" > ~/.autograder/submissions/694d9a62e15b786a95a51a22/code.js
$ docker run --rm -v ~/.autograder/submissions/694d9a62e15b786a95a51a22:/code js-runner

Output: hello ✓
```

### Directory Structure
```
~/.autograder/
└── submissions/
    ├── 694d9a62e15b786a95a51a22/
    │   └── code.js
    ├── 694d9a62e15b786a95a51a23/
    │   └── code.js
    └── ...
```

## Files Modified

1. **`/server/runner/run.js`**
   - Added file existence validation
   - Improved error handling

2. **`/server/src/components/services/dockerJudge.service.js`**
   - Changed from `/tmp` to `~/.autograder/submissions`
   - Added timeout protection (5 seconds)
   - Added error event handling
   - Added resolved flag to prevent double-resolution

3. **Docker Image** (`js-runner`)
   - Rebuilt with updated `run.js`
   - Command: `docker build -t js-runner .`

## Deployment Checklist

- [x] Update `dockerJudge.service.js` to use home directory
- [x] Rebuild Docker image: `cd server/runner && docker build -t js-runner .`
- [x] Test with sample submission
- [x] Verify timeout works for infinite loops
- [x] Verify error handling for runtime errors
- [ ] Add cleanup job to remove old submissions (optional)

## Future Improvements

1. **Cleanup Strategy**: Implement periodic cleanup of old submission directories
   ```javascript
   // Example cleanup function
   const cleanupOldSubmissions = (maxAgeHours = 24) => {
     // Remove submissions older than maxAgeHours
   };
   ```

2. **Resource Limits**: Add memory and CPU limits to Docker containers
   ```javascript
   docker run --rm --memory="128m" --cpus="0.5" -v ...
   ```

3. **Security**: Consider using Docker security options
   ```javascript
   docker run --rm --security-opt="no-new-privileges:true" -v ...
   ```

## Related Issues

- Docker Desktop Linux: `/tmp` mount issues
- Volume mount caching/staleness
- Timestamp synchronization between host and container

## Date Fixed
December 26, 2025

---

**Author**: Debugged and fixed by GitHub Copilot  
**Verified**: Working with submission ID `694d9a62e15b786a95a51a22`
