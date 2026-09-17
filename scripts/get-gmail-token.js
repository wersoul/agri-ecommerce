#!/usr/bin/env node
// Helper script: ขอ Gmail API OAuth2 Refresh Token
//
// วิธีใช้:
//   1. เปิด Gmail API ใน Google Cloud Console (project: knkpart)
//      https://console.cloud.google.com/apis/library → search "Gmail API" → Enable
//   2. ตั้ง OAuth client redirect URI = http://localhost:8765/callback
//      (Google Cloud Console → APIs & Services → Credentials → your OAuth client)
//   3. รัน: node scripts/get-gmail-token.js
//   4. Browser จะเปิด → login ด้วย ping105@gmail.com → Allow
//   5. Script จะ print refresh_token → copy ไปตั้งเป็น secret
//
// ตั้ง env vars ก่อนรัน (หรือ hardcode ในไฟล์):
//   GMAIL_CLIENT_ID     = 179225634939-evlp8fcbg6qhnivlgdoimdrd7lu98245.apps.googleusercontent.com
//   GMAIL_CLIENT_SECRET = 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
//
// หลังได้ refresh_token ตั้ง Cloudflare secret:
//   wrangler pages secret put GMAIL_REFRESH_TOKEN --project-name=agri-ecommerce

const http = require("http");
const { URL } = require("url");

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || "179225634939-evlp8fcbg6qhnivlgdoimdrd7lu98245.apps.googleusercontent.com";
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || "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";
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || "http://localhost:8765/callback";
const PORT = 8765;

// Gmail API scopes: send + compose (needed to send on behalf of user)
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
].join(" ");

function log(msg) {
  console.log(`\x1b[36m[gmail-oauth]\x1b[0m ${msg}`);
}

function openBrowser(url) {
  const { exec } = require("child_process");
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${cmd} "${url}"`);
}

async function exchangeCodeForToken(code) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });
  return await r.json();
}

async function main() {
  log(`Client ID: ${CLIENT_ID.slice(0, 30)}...`);
  log(`Redirect URI: ${REDIRECT_URI}`);
  log(`Scopes: ${SCOPES}`);

  const authUrl = new URL("https://accounts.google.com/o/oauth2/auth");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent"); // force to get refresh_token

  log(`\nเปิด URL นี้ใน browser:\n${authUrl.toString()}\n`);
  log("กำลังเปิด browser อัตโนมัติ...");
  openBrowser(authUrl.toString());

  // Start local HTTP server to receive the callback
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      if (url.pathname === "/callback") {
        const c = url.searchParams.get("code");
        const err = url.searchParams.get("error");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          err
            ? `<h1>❌ Error: ${err}</h1><p>กลับไปดู terminal</p>`
            : `<h1>✅ Authorization code ได้รับแล้ว</h1><p>กลับไปดู terminal เพื่อ copy refresh_token</p><script>window.close()</script>`
        );
        server.close();
        if (err) reject(new Error(err));
        else resolve(c);
      }
    });
    server.listen(PORT, () => log(`รอ callback ที่ http://localhost:${PORT}/callback`));
  });

  log(`ได้ authorization code: ${code.slice(0, 20)}...`);
  log("กำลังแลกเป็น refresh_token...");

  const token = await exchangeCodeForToken(code);
  if (token.error) {
    log(`❌ Error: ${JSON.stringify(token)}`);
    process.exit(1);
  }

  log(`\n✅ สำเร็จ! นำค่าด้านล่างไปตั้ง Cloudflare secret:\n`);
  console.log("─".repeat(60));
  console.log(`GMAIL_REFRESH_TOKEN=${token.refresh_token}`);
  console.log("─".repeat(60));
  log(`\n📋 ขั้นตอนถัดไป:`);
  log(`1. รันคำสั่งนี้ใน terminal:`);
  log(`   wrangler pages secret put GMAIL_REFRESH_TOKEN --project-name=agri-ecommerce`);
  log(`2. paste refresh_token ด้านบน`);
  log(`3. รันอีกคำสั่งเพื่อตั้งค่า provider:`);
  log(`   wrangler pages secret put EMAIL_PROVIDER --project-name=agri-ecommerce   # ตอบ gmail`);
  log(`   wrangler pages secret put EMAIL_FROM --project-name=agri-ecommerce     # ตอบ "KNK Part <ping105@gmail.com>"`);
  log(`4. redeploy แล้วทดสอบ: curl -X POST https://agri-ecommerce.pages.dev/api/admin/test-email -d '{"to":"knkpart@gmail.com"}' -H 'Content-Type: application/json'\n`);
}

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function ok(msg) { console.log(`\x1b[32m✅\x1b[0m ${msg}`); }
function err(msg) { console.log(`\x1b[31m❌\x1b[0m ${msg}`); }

const SCRIPT_DIR = __dirname;
const TOKEN_FILE = path.join(SCRIPT_DIR, ".gmail-refresh-token");
const PROJECT_NAME = "agri-ecommerce";

function setSecret(secretName, value) {
  try {
    execSync(
      `npx wrangler pages secret put ${secretName} --project-name=${PROJECT_NAME}`,
      { input: value, stdio: ["pipe", "inherit", "inherit"], cwd: path.join(SCRIPT_DIR, "..") }
    );
    ok(`set ${secretName}`);
    return true;
  } catch (e) {
    err(`failed to set ${secretName}: ${e.message}`);
    return false;
  }
}

async function main() {
  log(`Client ID: ${CLIENT_ID.slice(0, 30)}...`);
  log(`Redirect URI: ${REDIRECT_URI}`);

  // Check for existing token
  if (fs.existsSync(TOKEN_FILE)) {
    const existing = fs.readFileSync(TOKEN_FILE, "utf8").trim();
    if (existing) {
      log(`พบ refresh_token ที่บันทึกไว้แล้ว: ${existing.slice(0, 20)}...`);
      log(`ใช้ 'force' เพื่อขอใหม่, อื่นๆ = ใช้อันเดิม`);
      if ((process.argv[2] || "").toLowerCase() !== "force") {
        log("ใช้ token เดิม → ตั้ง secrets เลย...");
        const r = [
          setSecret("EMAIL_PROVIDER", "gmail"),
          setSecret("EMAIL_FROM", "KNK Part <ping105@gmail.com>"),
          setSecret("GMAIL_CLIENT_ID", CLIENT_ID),
          setSecret("GMAIL_CLIENT_SECRET", CLIENT_SECRET),
          setSecret("GMAIL_REFRESH_TOKEN", existing),
        ];
        if (r.every(Boolean)) ok("\n🎉 ตั้ง secrets ครบ!");
        process.exit(0);
      }
    }
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/auth");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  log(`\n📋 เปิด URL นี้ใน browser (จะเปิดให้อัตโนมัติ):\n${authUrl.toString()}\n`);
  log("🔐 กำลังรอ authorization จาก Google...");
  log("   1. login ด้วย ping105@gmail.com");
  log("   2. กด 'Allow' ทั้ง 2 scopes");
  log("   3. browser จะ redirect มาที่หน้า 'Authorization code ได้รับแล้ว'\n");
  openBrowser(authUrl.toString());

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      if (url.pathname === "/callback") {
        const c = url.searchParams.get("code");
        const e = url.searchParams.get("error");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        if (e) {
          res.end(`<h1 style="color:red">❌ Error: ${e}</h1><pre>${url.searchParams.get("error_description") || ""}</pre>`);
          server.close();
          reject(new Error(`${e}: ${url.searchParams.get("error_description") || ""}`));
        } else {
          res.end(`<h1 style="color:green">✅ Authorization code ได้รับแล้ว</h1><p>refresh_token กำลังถูกตั้งเป็น Cloudflare secret...</p><p>กลับไปดู terminal</p><script>setTimeout(()=>window.close(),3000)</script>`);
          server.close();
          resolve(c);
        }
      }
    });
    server.listen(PORT, () => log(`🌐 รอ callback ที่ http://localhost:${PORT}/callback`));
  });

  log(`\n🔄 ได้ authorization code แล้ว`);
  log("กำลังแลกเป็น refresh_token...");

  const token = await exchangeCodeForToken(code);
  if (token.error) {
    err(`Token exchange failed: ${JSON.stringify(token)}`);
    process.exit(1);
  }
  if (!token.refresh_token) {
    err(`No refresh_token in response: ${JSON.stringify(token)}`);
    err("ถ้าเคย authorize แล้ว Google จะไม่ return refresh_token ใหม่");
    err("วิธีแก้: ไปที่ https://myaccount.google.com/permissions → ลบ app แล้วรันใหม่");
    process.exit(1);
  }

  ok(`ได้ refresh_token: ${token.refresh_token.slice(0, 30)}...`);
  fs.writeFileSync(TOKEN_FILE, token.refresh_token, "utf8");
  log(`บันทึกไว้ที่ ${TOKEN_FILE}`);

  log("\n📦 กำลังตั้ง Cloudflare secrets (5 ตัว)...\n");
  const results = [
    setSecret("EMAIL_PROVIDER", "gmail"),
    setSecret("EMAIL_FROM", "KNK Part <ping105@gmail.com>"),
    setSecret("GMAIL_CLIENT_ID", CLIENT_ID),
    setSecret("GMAIL_CLIENT_SECRET", CLIENT_SECRET),
    setSecret("GMAIL_REFRESH_TOKEN", token.refresh_token),
  ];

  if (results.every(Boolean)) {
    ok("\n🎉 ตั้ง secrets ครบ 5 ตัวแล้ว!");
    log("\n📋 ขั้นตอนถัดไป:");
    log("   redeploy แล้วทดสอบ:");
    log('   curl -X POST https://agri-ecommerce.pages.dev/api/admin/test-email \\');
    log('        -H "Content-Type: application/json" \\');
    log('        -d \'{"to":"knkpart@gmail.com"}\'');
  } else {
    err("\n⚠️ บาง secret ตั้งไม่สำเร็จ กรุณารัน wrangler ด้วยตัวเอง");
  }
}

main().catch((e) => {
  err(`${e.message}`);
  process.exit(1);
});