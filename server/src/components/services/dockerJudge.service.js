const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

exports.runInDocker = (submissionId, code, input,language) => {
  const RUNNER_IMAGE = {
  javascript: "js-runner",
  python: "python-runner"
};

  // Use home directory instead of /tmp for Docker Desktop compatibility
  const baseDir = path.join(os.homedir(), ".autograder", "submissions");
  const dir = path.join(baseDir, submissionId.toString());
  const filename = language === 'python' ? 'code.py' : "code.js" 
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), code);
  fs.writeFileSync(path.join(dir, "input.txt"), input);

  return new Promise((resolve) => {
    const docker = spawn("docker", [
      "run",
      "--rm",
      "-v",
      `${dir}:/code`,
      RUNNER_IMAGE[language]
    ]);

    let stdout = "";
    let stderr = "";
    let resolved = false;

    // Timeout protection (5 seconds)
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        docker.kill();
        resolve({ status: "TLE", output: "Time limit exceeded" });
      }
    }, 5000);

    docker.stdout.on("data", d => stdout += d.toString());
    docker.stderr.on("data", d => stderr += d.toString());

    docker.on("close", (exitCode) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        if (exitCode === 0) {
          resolve({ status: "AC", output: stdout });
        } else {
          resolve({ status: "RE", output: stderr });
        }
      }
    });

    docker.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve({ status: "RE", output: err.toString() });
      }
    });
  });
};
