import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

/**
 * tripwire 관심 등록 폼.
 * SignupForm 패턴 재사용 (POST /api/signup → 실패 시 mailto fallback).
 * source="lunenlabs.com/tripwire", product="tripwire" 로 구분.
 * ⚠️ 레포는 비공개(법무 검토 전) — 라이브 GitHub 링크 없음. "곧 오픈소스 공개 예정"만 노출.
 */

type FormState = {
  name: string;
  email: string;
  stack: string;
  intent: string;
  consentPrivacy: boolean;
  consentMarketing: boolean;
};

const initialState: FormState = {
  name: "",
  email: "",
  stack: "",
  intent: "",
  consentPrivacy: false,
  consentMarketing: false,
};

const SIGNUP_ENDPOINT = "/api/signup";
const FALLBACK_EMAIL = "jhryu115@gmail.com";

export default function TwInterestForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const buildMailto = () => {
    // 개인정보보호법 §29: PII를 URL에 포함하지 않음
    const subject = encodeURIComponent(
      "[tripwire 관심 등록 fallback] /tripwire 양식 내용 첨부 요망"
    );
    return `mailto:${FALLBACK_EMAIL}?subject=${subject}`;
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.consentPrivacy) {
      setErrorMsg("개인정보 수집 · 이용 동의에 체크해주셔야 진행할 수 있어요.");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch(SIGNUP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          stack: form.stack,
          intent: form.intent,
          consent_marketing: form.consentMarketing,
          product: "tripwire",
          source: "lunenlabs.com/tripwire",
        }),
      });
      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(`HTTP ${res.status}: ${errJson.error || "unknown"}`);
      }
      const json = (await res.json().catch(() => ({}))) as { success?: boolean };
      if (json.success !== true) {
        throw new Error(`signup response: ${JSON.stringify(json)}`);
      }
      setStatus("success");
    } catch (err) {
      console.warn("[tw-interest] /api/signup POST failed, falling back to mailto", err);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-white/[0.04] backdrop-blur-xl border border-aqua/30 rounded-3xl p-10 text-center shadow-xl">
        <div className="w-16 h-16 rounded-full bg-aqua/15 flex items-center justify-center mx-auto mb-5">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-aqua"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-white text-2xl font-bold mb-3">등록됐어요 🎉</h3>
        <p className="text-white/70 mb-6 leading-relaxed">
          {form.name}님, 감사해요. tripwire가 오픈소스로 공개되면
          <br />
          가장 먼저 알려드릴게요.
        </p>
        <button
          onClick={() => {
            setForm(initialState);
            setStatus("idle");
          }}
          className="text-aqua font-semibold text-sm hover:underline"
        >
          다른 등록도 추가해보기 →
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-7 sm:p-10 shadow-xl"
    >
      <h3 className="text-white text-2xl sm:text-3xl font-bold mb-2">
        오픈소스 공개 알림 받기
      </h3>
      <p className="text-white/55 text-sm mb-7">
        tripwire는 곧 오픈소스로 공개될 예정이에요. 공개 시점에 가장 먼저 안내드릴게요.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Field
          label="이름"
          required
          value={form.name}
          onChange={(v) => update("name", v)}
          placeholder="홍길동"
        />
        <Field
          label="이메일"
          required
          type="email"
          value={form.email}
          onChange={(v) => update("email", v)}
          placeholder="example@email.com"
        />
      </div>

      <div className="mb-4">
        <Field
          label="주로 쓰는 스택 · AI 코딩 툴 (선택)"
          value={form.stack}
          onChange={(v) => update("stack", v)}
          placeholder="예) TypeScript · Claude Code · Cursor"
        />
      </div>

      <div className="mb-6">
        <label className="block text-white text-sm font-semibold mb-2">
          어떤 부분이 가장 궁금하세요? (선택)
        </label>
        <textarea
          value={form.intent}
          onChange={(e) => update("intent", e.target.value)}
          rows={3}
          placeholder="예) AI 수정 루프 멈춤 / blast radius 가시화 / CI 게이트 연동"
          className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 focus:border-aqua focus:ring-2 focus:ring-aqua/20 outline-none text-sm text-white placeholder:text-white/35 transition-all resize-none"
        />
      </div>

      <div className="space-y-3 mb-6 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
        <Checkbox
          checked={form.consentPrivacy}
          onChange={(v) => update("consentPrivacy", v)}
          required
        >
          <span className="text-sm text-white/80">
            <strong className="text-white">(필수)</strong> 개인정보 수집 · 이용에 동의해요.{" "}
            <Link to="/privacy" className="text-aqua underline underline-offset-2">
              자세히 보기
            </Link>
          </span>
        </Checkbox>
        <Checkbox
          checked={form.consentMarketing}
          onChange={(v) => update("consentMarketing", v)}
        >
          <span className="text-sm text-white/80">
            (선택) 공개 안내·업데이트 같은 마케팅 정보 수신에 동의해요.
          </span>
        </Checkbox>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
          {errorMsg}
        </div>
      )}

      {status === "error" ? (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-sm text-white/80">
            잠깐, 자동 전송이 안 됐어요. 아래 버튼을 누르면 이메일 앱이 열려요. 본문에
            이름·이메일·스택을 직접 적어 주시면 운영자에게 전달돼요. (개인정보 보호를
            위해 자동으로 채우지 않아요.)
          </div>
          <a
            href={buildMailto()}
            className="block w-full py-4 rounded-xl bg-aqua text-navy-deep font-semibold text-center hover:bg-aqua-dark hover:text-white transition-colors"
          >
            이메일로 등록 보내기 →
          </a>
        </div>
      ) : (
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full py-4 rounded-xl bg-aqua text-navy-deep font-semibold hover:bg-aqua-dark hover:text-white hover:scale-[1.005] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-aqua/20"
        >
          {status === "submitting" ? "전송 중..." : "공개 알림 받기"}
        </button>
      )}

      <p className="mt-4 text-xs text-white/40 text-center">
        공개 안내 외 목적으로 사용되지 않아요.
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-white text-sm font-semibold mb-2">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 focus:border-aqua focus:ring-2 focus:ring-aqua/20 outline-none text-sm text-white placeholder:text-white/35 transition-all"
      />
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  required,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        className="mt-0.5 w-4 h-4 accent-aqua cursor-pointer shrink-0"
      />
      <span className="leading-relaxed">{children}</span>
    </label>
  );
}
