// Email sender using fetch-based HTTP API (Resend / SendGrid / Mailgun / Gmail API compatible)
// Configure via Cloudflare Pages secret: EMAIL_API_KEY
// Configure EMAIL_PROVIDER = 'resend' (default) | 'sendgrid' | 'mailgun' | 'gmail'
//
// Gmail provider ต้องการ:
//   EMAIL_PROVIDER      = gmail
//   EMAIL_FROM          = "KNK Part <ping105@gmail.com>"
//   GMAIL_CLIENT_ID     = <OAuth2 client id from Google Cloud Console>
//   GMAIL_CLIENT_SECRET = <OAuth2 client secret>
//   GMAIL_REFRESH_TOKEN = <Refresh token from OAuth flow (use scripts/get-gmail-token.js)>

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailConfig {
  apiKey: string;
  provider: 'resend' | 'sendgrid' | 'mailgun' | 'gmail';
  from: string;
}

function getConfig(): EmailConfig | null {
  // @ts-ignore
  const apiKey = process.env.EMAIL_API_KEY;
  // @ts-ignore
  const provider = (process.env.EMAIL_PROVIDER || 'resend') as EmailConfig['provider'];
  // @ts-ignore
  const from = process.env.EMAIL_FROM || 'KNK Part <noreply@knkpart.com>';
  if (!apiKey && provider !== 'gmail') return null;
  return { apiKey: apiKey || '', provider, from };
}

// Gmail API: get fresh access_token using refresh_token
async function getGmailAccessToken(): Promise<string> {
  // @ts-ignore
  const clientId = process.env.GMAIL_CLIENT_ID;
  // @ts-ignore
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  // @ts-ignore
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN");
  }
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Refresh token failed: ${r.status} ${err}`);
  }
  const data: any = await r.json();
  return data.access_token;
}

// Encode header value for non-ASCII (RFC 2047 B-encoded, used for Subject + display names).
// Splits at UTF-8 character boundaries so multi-byte chars are never cut mid-sequence.
function encodeHeader(value: string): string {
  // Pure ASCII (incl. common punctuation) → return as-is
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  // Walk code points; build chunks of <=45 bytes; never split a multi-byte sequence.
  // Using `for (const ch of value)` iterates by code point (not UTF-16 unit).
  const chunks: string[] = [];
  let cur = "";
  let curBytes = 0;
  for (const ch of value) {
    const chBytes = new TextEncoder().encode(ch).length;
    if (curBytes + chBytes > 45 && cur.length > 0) {
      chunks.push(cur);
      cur = ch;
      curBytes = chBytes;
    } else {
      cur += ch;
      curBytes += chBytes;
    }
  }
  if (cur.length > 0) chunks.push(cur);
  // Convert each chunk to UTF-8 bytes → binary string → base64 via btoa (Edge-safe)
  let out = "";
  for (let idx = 0; idx < chunks.length; idx++) {
    const bytes = new TextEncoder().encode(chunks[idx]);
    let bin = "";
    for (let k = 0; k < bytes.length; k++) bin += String.fromCharCode(bytes[k]);
    out += (idx > 0 ? "\r\n " : "") + "=?UTF-8?B?" + btoa(bin) + "?=";
  }
  return out;
}

// Gmail API: build RFC 2822 raw email and base64url encode
function buildGmailRaw(opts: EmailOptions, from: string): string {
  const fromMatch = from.match(/<(.+)>/);
  const fromEmail = fromMatch ? fromMatch[1] : from;
  const fromName = (from.replace(/<.*>/, "").trim() || "KNK Part");
  const boundary = "knk_boundary_" + Math.random().toString(36).slice(2);
  const lines: string[] = [
    `From: ${encodeHeader(fromName)} <${fromEmail}>`,
    `To: ${encodeHeader(opts.to)}`,
    `Subject: ${encodeHeader(opts.subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    "",
    opts.text || "",
    "",
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    "",
    opts.html,
    "",
    `--${boundary}--`,
  ];
  // Gmail API requires base64url-encoded raw email
  const b64 = Buffer.from(lines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return b64;
}

// Gmail API: send email
async function sendViaGmail(opts: EmailOptions, from: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const accessToken = await getGmailAccessToken();
    const raw = buildGmailRaw(opts, from);
    const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });
    if (!r.ok) {
      const err = await r.text();
      return { ok: false, error: `Gmail API ${r.status}: ${err}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: `Gmail API error: ${e.message || e}` };
  }
}

export async function sendEmail(opts: EmailOptions): Promise<{ ok: boolean; error?: string; dev?: boolean }> {
  const config = getConfig();
  if (!config) {
    // Dev mode: log to console, OTP can be retrieved via admin API
    console.log('[EMAIL DEV MODE]', JSON.stringify({ to: opts.to, subject: opts.subject, text: opts.text }, null, 2));
    return { ok: true, dev: true };
  }

  try {
    if (config.provider === 'resend') {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.from,
          to: opts.to,
          subject: opts.subject,
          html: opts.html,
          text: opts.text,
        }),
      });
      if (!r.ok) {
        const err = await r.text();
        return { ok: false, error: `Resend ${r.status}: ${err}` };
      }
      return { ok: true };
    }

    if (config.provider === 'sendgrid') {
      const fromMatch = config.from.match(/<(.+)>/);
      const fromEmail = fromMatch ? fromMatch[1] : config.from;
      const fromName = (config.from.replace(/<.*>/, '').trim()) || 'KNK Part';
      const content: any[] = [{ type: 'text/html', value: opts.html }];
      if (opts.text) content.push({ type: 'text/plain', value: opts.text });
      const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: opts.to }] }],
          from: { email: fromEmail, name: fromName },
          subject: opts.subject,
          content,
        }),
      });
      if (!r.ok) {
        const err = await r.text();
        return { ok: false, error: `SendGrid ${r.status}: ${err}` };
      }
      return { ok: true };
    }

    if (config.provider === 'mailgun') {
      const domain = (process.env.EMAIL_FROM as string || '').match(/@(.+)/)?.[1] || 'mg.knkpart.com';
      const r = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${config.apiKey}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          from: config.from,
          to: opts.to,
          subject: opts.subject,
          html: opts.html,
          text: opts.text || '',
        }),
      });
      if (!r.ok) {
        const err = await r.text();
        return { ok: false, error: `Mailgun ${r.status}: ${err}` };
      }
      return { ok: true };
    }

    if (config.provider === 'gmail') {
      return await sendViaGmail(opts, config.from);
    }

    return { ok: false, error: 'Unknown email provider' };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// Email templates
export function otpEmail(otp: string, purpose: 'register' | 'reset_password'): { subject: string; html: string; text: string } {
  const isReset = purpose === 'reset_password';
  const subject = isReset
    ? `[KNK Part] รหัสรีเซ็ตรหัสผ่านของคุณ: ${otp}`
    : `[KNK Part] ยืนยันการสมัครสมาชิก: ${otp}`;
  const text = `รหัส OTP ของคุณคือ: ${otp}\n\nใช้ได้ภายใน 10 นาที\nหากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยอีเมลนี้`;
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f5f5; padding:20px;">
  <div style="max-width:480px; margin:0 auto; background:white; padding:32px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="text-align:center; margin-bottom:24px;">
      <h2 style="color:#166534; margin:0;">KNK Part</h2>
      <p style="color:#6b7280; font-size:13px; margin:4px 0;">เคเอ็นเค พาร์ท - อะไหล่เกษตร</p>
    </div>
    <h3 style="color:#111; margin:0 0 12px;">${isReset ? '🔑 รีเซ็ตรหัสผ่าน' : '✅ ยืนยันการสมัครสมาชิก'}</h3>
    <p style="color:#374151; line-height:1.6;">${isReset ? 'คุณได้ร้องขอรีเซ็ตรหัสผ่าน ใช้รหัส OTP ด้านล่างเพื่อตั้งรหัสผ่านใหม่:' : 'ยินดีต้อนรับ! ใช้รหัส OTP ด้านล่างเพื่อยืนยันอีเมลของคุณ:'}</p>
    <div style="background:#f0fdf4; border:2px dashed #16a34a; border-radius:8px; padding:20px; text-align:center; margin:20px 0;">
      <span style="font-size:32px; font-weight:bold; letter-spacing:6px; color:#166534;">${otp}</span>
    </div>
    <p style="color:#6b7280; font-size:13px;">⏰ รหัสนี้ใช้ได้ภายใน <strong>10 นาที</strong></p>
    <p style="color:#6b7280; font-size:13px;">หากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยอีเมลนี้</p>
    <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;"/>
    <p style="color:#9ca3af; font-size:11px; text-align:center;">© KNK Part - เคเอ็นเค พาร์ท</p>
  </div>
</body></html>`;
  return { subject, html, text };
}