#!/bin/bash
# Setup Resend secrets on Cloudflare Pages สำหรับ knkpart.com
#
# Resend คือ email API service ที่ใช้ส่งอีเมลผ่าน HTTP API
# ดูวิธีใช้: https://resend.com/docs/api-reference/emails/send-email
#
# ขั้นตอน:
#   1) สมัคร/ล็อกอิน Resend → https://resend.com
#   2) Verify domain knkpart.com ที่ https://resend.com/domains
#      - Cloudflare DNS: เพิ่ม TXT และ MX records ตามที่ Resend บอก
#   3) สร้าง API Key ที่ https://resend.com/api-keys (ขอบเขต: Sending access)
#   4) รันสคริปต์นี้แล้วใส่ API Key เมื่อถูกถาม
#
#   ./setup-resend-secrets.sh

set -e
cd "$(dirname "$0")"

# Check wrangler auth
if ! ./node_modules/.bin/wrangler whoami >/dev/null 2>&1; then
  echo "❌ wrangler ยังไม่ได้ login — รัน: ./node_modules/.bin/wrangler login"
  exit 1
fi

echo "🔐 กำลังตั้ง Cloudflare secrets สำหรับ Resend (knkpart.com)..."
echo ""

# 1. EMAIL_PROVIDER
echo -n "resend" | ./node_modules/.bin/wrangler pages secret put EMAIL_PROVIDER --project-name=knkpart >/dev/null
echo "✅ EMAIL_PROVIDER=resend"

# 2. EMAIL_FROM — ใช้ knkpart.com domain ที่ verify แล้วใน Resend dashboard
echo -n "KNK Part <noreply@knkpart.com>" | ./node_modules/.bin/wrangler pages secret put EMAIL_FROM --project-name=knkpart >/dev/null
echo "✅ EMAIL_FROM=KNK Part <noreply@knkpart.com>"

# 3. EMAIL_API_KEY — ถามแบบไม่ echo (ใช้ /dev/tty)
echo ""
echo "📋 ใส่ Resend API Key (re_xxxxxxxxxxxx):"
if [ -t 0 ]; then
  # interactive
  read -r -s API_KEY
else
  # non-interactive (CI) — อ่านจาก env หรือ argument
  API_KEY="${1:-${RESEND_API_KEY:-}}"
  if [ -z "$API_KEY" ]; then
    echo "❌ ไม่ได้ระบุ API Key — วิธีใช้: $0 <API_KEY> หรือ export RESEND_API_KEY=re_xxx"
    exit 1
  fi
fi
if [ -z "$API_KEY" ]; then
  echo "❌ API Key ว่าง — ยกเลิก"
  exit 1
fi
echo -n "$API_KEY" | ./node_modules/.bin/wrangler pages secret put EMAIL_API_KEY --project-name=knkpart >/dev/null
echo "✅ EMAIL_API_KEY=${API_KEY:0:8}..."

echo ""
echo "🎉 ตั้ง Resend secrets ครบ 3 ตัวแล้ว!"
echo ""
echo "📋 ขั้นตอนถัดไป:"
echo "   1) Verify ว่า knkpart.com อยู่ใน Resend dashboard แล้ว (https://resend.com/domains)"
echo "   2) ดูว่า Cloudflare DNS มี MX records ของ Resend แล้ว:"
echo "      sending-domain.knkpart.com  MX  feedback-smtp.us-east-1.amazonses.com 10"
echo "      resend._domainkey.knkpart.com  CNAME  resend._domainkey.us-east-1.amazonses.com"
echo "      (ถ้ายังไม่มี Resend จะแสดง record ที่ต้องเพิ่มในหน้า Verify Domain)"
echo ""
echo "   3) ทดสอบส่ง email:"
echo '      curl -X POST https://knkpart.com/api/admin/test-email \'
echo '           -H "Content-Type: application/json" \'
echo "           -H 'Authorization: Bearer <admin-token>' \\"
echo '           -d '"'"'{"to":"your-email@example.com"}'"'"''
echo ""
echo "   4) ถ้าส่งสำเร็จ ให้ดู Activity ที่ https://resend.com/emails"