/**
 * Vercel Edge Function: PT 사전가입 폼 처리
 *
 * 1. POST /api/signup으로 React 폼 전송
 * 2. 입력 검증 + XSS escape
 * 3. Resend API로 PT 브랜드 적용된 HTML 이메일을 jhryu115@gmail.com으로 발송
 * 4. Reply-To = 가입자 이메일 → Junghyun이 메일 클라이언트에서 직접 회신 가능
 *
 * 환경변수: RESEND_API_KEY (Vercel Project Settings → Environment Variables에서 등록)
 *
 * 무료 한도: Resend free tier 3,000건/월 + 100건/일
 *           free tier에서 sandbox 도메인(onboarding@resend.dev)으로 발송하면
 *           수신자는 gmail 등 임의 도메인 OK. 단 발신 도메인 verify는 추후 권장.
 */

import { Resend } from "resend";

export const config = {
  runtime: "edge",
};

const TO_EMAIL = "jhryu115@gmail.com";
const FROM_EMAIL = "PetTracker <onboarding@resend.dev>";

interface SignupBody {
  name?: string;
  email?: string;
  pet_name?: string;
  pet_breed?: string;
  area?: string;
  walk_freq?: string;
  intent?: string;
  consent_marketing?: boolean;
  source?: string;
}

const WALK_FREQ_LABELS: Record<string, string> = {
  daily: "거의 매일",
  "3-5w": "주 3~5회",
  "1-2w": "주 1~2회",
  rare: "거의 안 해요",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function nowKstString(): string {
  return new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildHtml(d: Required<SignupBody> & { walk_freq_label: string; submitted_at_kst: string }): string {
  const e = escapeHtml;
  const marketingBg = d.consent_marketing ? "#2d9e6b" : "#a0826b";
  const marketingLabel = d.consent_marketing ? "동의" : "미동의";

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>새 PT 사전가입</title>
</head>
<body style="margin:0; padding:0; background:#fff8f0; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', 'Apple SD Gothic Neo', system-ui, sans-serif; color:#2a1d10; -webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff8f0; padding:32px 16px;">
<tr><td align="center">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:24px; overflow:hidden; max-width:600px; box-shadow:0 4px 24px rgba(196,125,16,0.10);">

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg, #f4a22d 0%, #2d9e6b 100%); padding:36px 40px; color:#ffffff;">
<div style="font-size:12px; font-weight:700; letter-spacing:0.10em; text-transform:uppercase; opacity:0.92; margin-bottom:10px;">🐾 새 사전가입 도착</div>
<div style="font-size:30px; font-weight:800; line-height:1.15; letter-spacing:-0.02em;">${e(d.name)}</div>
<div style="font-size:15px; margin-top:8px; opacity:0.95; font-weight:500;">${e(d.area || "지역 미입력")} · ${e(d.walk_freq_label)}</div>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:32px 40px;">

<!-- Email row -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr>
<td style="padding:14px 18px; background:#fffaf2; border:1px solid #f0e0c8; border-radius:12px;">
<div style="font-size:11px; color:#a0826b; text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">📧 회신 이메일</div>
<div style="font-size:16px; margin-top:6px;"><a href="mailto:${e(d.email)}" style="color:#c47d10; text-decoration:none; font-weight:700;">${e(d.email)}</a></div>
</td>
</tr>
</table>

<!-- Pet card -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg, #fff8f0 0%, #fff0e0 100%); border:1px solid rgba(196,125,16,0.18); border-radius:16px; margin-bottom:24px;">
<tr>
<td style="padding:22px 26px;">
<div style="font-size:11px; color:#c47d10; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:12px;">🐶 강아지</div>
<div style="font-size:24px; font-weight:800; color:#2a1d10; line-height:1.2; letter-spacing:-0.01em;">${e(d.pet_name || "이름 미입력")}</div>
<div style="font-size:14px; color:#5a4632; margin-top:6px;">${e(d.pet_breed || "견종 · 나이 미입력")}</div>
</td>
</tr>
</table>

${d.intent && d.intent !== "-" ? `<!-- Intent quote -->
<div style="border-left:4px solid #2d9e6b; padding:14px 0 14px 18px; margin-bottom:24px; background:rgba(45,158,107,0.04); border-radius:0 10px 10px 0;">
<div style="font-size:11px; color:#2d9e6b; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:8px;">💬 관심 사항</div>
<div style="font-size:15px; color:#2a1d10; line-height:1.65;">"${e(d.intent)}"</div>
</div>` : ""}

<!-- Meta badges -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #f0e0c8; padding-top:18px;">
<tr>
<td style="padding-bottom:12px;">
<span style="display:inline-block; padding:6px 14px; border-radius:999px; background:${marketingBg}; color:#ffffff; font-size:11px; font-weight:700; letter-spacing:0.04em; margin-right:6px;">마케팅 ${marketingLabel}</span>
<span style="display:inline-block; padding:6px 14px; border-radius:999px; background:#fff0e0; color:#c47d10; font-size:11px; font-weight:700; border:1px solid rgba(196,125,16,0.2);">${e(d.source || "lunenlabs.com/pet")}</span>
</td>
</tr>
<tr>
<td style="font-size:12px; color:#a0826b; padding-top:6px;">📅 ${e(d.submitted_at_kst)} (KST)</td>
</tr>
</table>

</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#fff8f0; padding:20px 40px; text-align:center; border-top:1px solid #f0e0c8;">
<div style="font-size:13px; color:#5a4632; font-weight:700;">PetTracker · by LunenLabs</div>
<a href="https://lunenlabs.com/pet" style="font-size:12px; color:#c47d10; text-decoration:none; display:block; margin-top:6px; font-weight:600;">lunenlabs.com/pet →</a>
</td>
</tr>

</table>

<div style="font-size:11px; color:#a0826b; margin-top:18px; max-width:600px; line-height:1.6;">이 메일은 lunenlabs.com/pet 사전가입 폼에서 자동 발송됐습니다.<br>이 메일에 직접 "회신"하면 가입자(${e(d.email)})에게 답장 발송됩니다.</div>

</td></tr>
</table>
</body>
</html>`;
}

function buildPlainText(d: Required<SignupBody> & { walk_freq_label: string; submitted_at_kst: string }): string {
  return [
    "🐾 새 PT 사전가입",
    "",
    `이름: ${d.name}`,
    `이메일: ${d.email}`,
    `강아지: ${d.pet_name || "-"} (${d.pet_breed || "-"})`,
    `지역: ${d.area || "-"}`,
    `산책 빈도: ${d.walk_freq_label}`,
    `관심 사항: ${d.intent || "-"}`,
    `마케팅 동의: ${d.consent_marketing ? "Y" : "N"}`,
    `유입 경로: ${d.source}`,
    `제출 시각: ${d.submitted_at_kst} (KST)`,
    "",
    "이 메일에 회신하면 가입자에게 답장 발송됩니다.",
    "lunenlabs.com/pet",
  ].join("\n");
}

export default async function handler(req: Request): Promise<Response> {
  // CORS preflight (same-origin이라 사실 필요 없지만 안전망)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!process.env.RESEND_API_KEY) {
    return Response.json(
      { error: "Server misconfigured: RESEND_API_KEY missing" },
      { status: 500 }
    );
  }

  let body: SignupBody;
  try {
    body = (await req.json()) as SignupBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim();

  if (!name) return Response.json({ error: "이름이 필요해요" }, { status: 400 });
  if (!email || !isValidEmail(email)) {
    return Response.json({ error: "유효한 이메일이 필요해요" }, { status: 400 });
  }

  const data = {
    name,
    email,
    pet_name: (body.pet_name || "").trim(),
    pet_breed: (body.pet_breed || "").trim(),
    area: (body.area || "").trim(),
    walk_freq: (body.walk_freq || "").trim(),
    intent: (body.intent || "").trim(),
    consent_marketing: Boolean(body.consent_marketing),
    source: (body.source || "lunenlabs.com/pet").trim(),
    walk_freq_label: WALK_FREQ_LABELS[body.walk_freq || ""] || body.walk_freq || "미선택",
    submitted_at_kst: nowKstString(),
  };

  const subject = `🐾 [PT 사전가입] ${data.name} (${data.area || "지역미입력"})`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      replyTo: data.email,
      subject,
      html: buildHtml(data),
      text: buildPlainText(data),
    });
    if (error) {
      console.error("[signup] Resend error", error);
      return Response.json(
        { error: "이메일 전송 실패", detail: error.message },
        { status: 502 }
      );
    }
    return Response.json({ success: true });
  } catch (err) {
    console.error("[signup] Unexpected error", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
