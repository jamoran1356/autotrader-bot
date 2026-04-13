const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

for (const entry of ["artifacts", "cache"]) {
  fs.rmSync(path.join(rootDir, entry), { recursive: true, force: true });
}

console.log("Removed artifacts and cache directories");