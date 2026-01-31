const { spawn } = require("child_process");
const fs = require("fs");

if (!fs.existsSync("/code/code.js")) {
  console.error("code.js not found");
  process.exit(1);
}

// run user code as isolated process
const child = spawn("node", ["/code/code.js"], {
  stdio: ["pipe", "inherit", "inherit"],
});

// pipe test input → REAL stdin
if (fs.existsSync("/code/input.txt")) {
  fs.createReadStream("/code/input.txt").pipe(child.stdin);
} else {
  child.stdin.end();
}

// exit runner when user program finishes
child.on("exit", (code) => {
  process.exit(code);
});
