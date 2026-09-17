// next.config.js
// Configuration สำหรับ Next.js เมื่อ Deploy บน Cloudflare Pages
// ใช้ @cloudflare/next-on-pages ในการ build API routes เป็น Cloudflare Functions

const fs = require("fs");
const path = require("path");

// Post-process function: patch require("async_hooks") -> require("node:async_hooks")
// ใน .vercel/output/functions หลัง build เสร็จ เพราะ webpack generate แบบนี้
// แต่ esbuild ของ next-on-pages@1.10 ที่ใช้กับ Node 26 ไม่สามารถ resolve "async_hooks" ได้
function patchAsyncHooksInVercelOutput() {
  const functionsDir = path.join(process.cwd(), ".vercel", "output", "functions");
  if (!fs.existsSync(functionsDir)) return;

  let patchedCount = 0;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith(".js") || entry.endsWith(".cjs")) {
        const content = fs.readFileSync(fullPath, "utf8");
        if (content.includes('require("async_hooks")')) {
          fs.writeFileSync(
            fullPath,
            content.replace(/require\("async_hooks"\)/g, 'require("node:async_hooks")'),
            "utf8"
          );
          patchedCount++;
        }
      }
    }
  }
  walk(functionsDir);
  if (patchedCount > 0) {
    console.log(`[next.config.js] Patched ${patchedCount} files in .vercel/output/functions`);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "jose"],
  },
  webpack: (config, { isServer }) => {
    return config;
  },
};

module.exports = nextConfig;
module.exports.patchAsyncHooksInVercelOutput = patchAsyncHooksInVercelOutput;