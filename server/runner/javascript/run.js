const fs = require("fs");

try {
  if (!fs.existsSync("/code/code.js")) {
    throw new Error("code.js not found");
  }

  const input = fs.readFileSync("/code/input.txt", "utf8");
  process.stdin.push(input);
  process.stdin.push(null);

  delete require.cache[require.resolve("/code/code.js")];
  require("/code/code.js");

  process.exit(0);
} catch (err) {
  console.error(err.toString());
  process.exit(1);
}
