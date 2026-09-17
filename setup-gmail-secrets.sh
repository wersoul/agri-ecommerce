#!/bin/bash
# Setup Gmail secrets on Cloudflare Pages (one-shot)
# วิธีใช้: ./setup-gmail-secrets.sh
set -e
cd "$(dirname "$0")"

# Check wrangler auth
if ! ./node_modules/.bin/wrangler whoami >/dev/null 2>&1; then
  echo "❌ wrangler ยังไม่ได้ login — รัน: ./node_modules/.bin/wrangler login"
  exit 1
fi

echo "🔐 กำลังตั้ง Cloudflare secrets (5 ตัว)..."
echo ""

# 1. EMAIL_PROVIDER
echo -n "gmail" | ./node_modules/.bin/wrangler pages secret put EMAIL_PROVIDER --project-name=agri-ecommerce >/dev/null
echo "✅ EMAIL_PROVIDER=gmail"

# 2. EMAIL_FROM
echo -n "KNK Part <ping105@gmail.com>" | ./node_modules/.bin/wrangler pages secret put EMAIL_FROM --project-name=agri-ecommerce >/dev/null
echo "✅ EMAIL_FROM=KNK Part <ping105@gmail.com>"

# 3. GMAIL_CLIENT_ID
echo -n "179225634939-evlp8fcbg6qhnivlgdoimdrd7lu98245.apps.googleusercontent.com" | ./node_modules/.bin/wrangler pages secret put GMAIL_CLIENT_ID --project-name=agri-ecommerce >/dev/null
echo "✅ GMAIL_CLIENT_ID=179225634939-..."

# 4. GMAIL_CLIENT_SECRET
echo -n "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" | ./node_modules/.bin/wrangler pages secret put GMAIL_CLIENT_SECRET --project-name=agri-ecommerce >/dev/null
echo "✅ GMAIL_CLIENT_SECRET=GOCSPX-..."

# 5. GMAIL_REFRESH_TOKEN (read from file, NOT echoed for security)
TOKEN_FILE="scripts/.gmail-refresh-token"
if [ ! -f "$TOKEN_FILE" ]; then
  echo "❌ ไม่พบ $TOKEN_FILE — กรุณารัน: node scripts/get-gmail-token.js"
  exit 1
fi
TOKEN=$(cat "$TOKEN_FILE")
echo -n "$TOKEN" | ./node_modules/.bin/wrangler pages secret put GMAIL_REFRESH_TOKEN --project-name=agri-ecommerce >/dev/null
echo "✅ GMAIL_REFRESH_TOKEN=${TOKEN:0:25}..."

echo ""
echo "🎉 ตั้ง secrets ครบ 5 ตัวแล้ว!"
echo ""
echo "📋 ขั้นตอนถัดไป:"
echo "   ./node_modules/.bin/wrangler pages secret list --project-name=agri-ecommerce"
echo ""
echo "   ทดสอบส่ง email:"
echo '   curl -X POST https://agri-ecommerce.pages.dev/api/admin/test-email \'
echo '        -H "Content-Type: application/json" \'
echo '        -d '"'"'{"to":"knkpart@gmail.com"}'"'"'