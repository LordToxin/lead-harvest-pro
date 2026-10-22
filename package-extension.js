const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("Packaging LeadHarvest Pro for Chrome Web Store...");

// Files and folders to include
const distZip = path.join(__dirname, "lead-harvest-pro-v1.0.0.zip");
if (fs.existsSync(distZip)) {
  fs.unlinkSync(distZip);
}

// Use PowerShell Compress-Archive on Windows
const zipCmd = `powershell -Command "Compress-Archive -Path 'manifest.json', 'popup', 'scripts', 'icons', 'README.md' -DestinationPath '${distZip}' -Force"`;
try {
  execSync(zipCmd);
  console.log(`✅ Extension successfully packaged: ${distZip}`);
} catch (e) {
  console.error("Packaging failed:", e);
}
