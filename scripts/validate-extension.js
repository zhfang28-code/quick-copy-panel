"use strict";

const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const errors = [];

if (manifest.manifest_version !== 3) {
  errors.push("manifest_version must be 3");
}

if (!/^\d+\.\d+\.\d+$/.test(manifest.version || "")) {
  errors.push("version must use x.y.z format");
}

const declaredFiles = [
  manifest.background && manifest.background.service_worker,
  ...(manifest.content_scripts || []).flatMap((entry) => [
    ...(entry.js || []),
    ...(entry.css || [])
  ]),
  ...(manifest.web_accessible_resources || []).flatMap((entry) => entry.resources || [])
].filter(Boolean);

for (const relativeFile of declaredFiles) {
  const absoluteFile = path.resolve(projectRoot, relativeFile);
  const isInsideProject = absoluteFile.startsWith(`${projectRoot}${path.sep}`);

  if (!isInsideProject) {
    errors.push(`manifest path escapes project root: ${relativeFile}`);
  } else if (!fs.existsSync(absoluteFile)) {
    errors.push(`manifest file does not exist: ${relativeFile}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Manifest OK (${declaredFiles.length} referenced files checked).`);
}
