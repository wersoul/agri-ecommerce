#!/usr/bin/env node
// Post-process Next.js build output to replace require("async_hooks") with require("node:async_hooks")
// This is needed because Next.js 14.2 webpack generates require("async_hooks") which esbuild
// cannot bundle when running on Node v26 (esbuild can't resolve node built-ins without prefix)
// Run after next build, before next-on-pages

const fs = require("fs");
const path = require("path");

const FUNCTIONS_DIR = path.join(process.cwd(), ".vercel", "output", "functions");

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, callback);
    } else if (file.endsWith(".js") || file.endsWith(".cjs")) {
      callback(fullPath);
    }
  }
}

let patched = 0;
if (fs.existsSync(FUNCTIONS_DIR)) {
  walk(FUNCTIONS_DIR, (file) => {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes('require("async_hooks")')) {
      const newContent = content.replace(
        /require\("async_hooks"\)/g,
        'require("node:async_hooks")'
      );
      fs.writeFileSync(file, newContent, "utf8");
      patched++;
      console.log(`[post-build] Patched ${path.relative(process.cwd(), file)}`);
    }
  });
}

console.log(`[post-build] Patched ${patched} files in .vercel/output/functions`);