import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

type FormState = {
  name: string;
  email: string;
  petName: string;
  petBreed: string;
  area: string;
  walkFreq: string;
  intent: string;
  consentPrivacy: boolean;
  consentMarketing: boolean;
};

const initialState: FormState = {
  name: "",
  email: "",
  petName: "",
  petBreed: "",
  area: "",
  walkFreq: "",
  intent: "",
  consentPrivacy: false,
  consentMarketing: false,
};

const SIGNUP_ENDPOINT = "/api/v1/prelaunch/signup";
const FALLBACK_EMAIL = "jhryu115@gmail.com";

export default function SignupForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const buildMailto = () => {
    // 개인정보보호법 §29: PII를 URL에 포함하지 않음 (브라우저 히스토리·Referer·프록시 access log 노출 방지)
    const subject = encodeURIComponent("[PT 사전가입 fallback] 양식 내용 첨부 요망");
    return `mailto:${FALLBACK_EMAIL}?subject=${subject}`;
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.consentPrivacy) {
      setErrorMsg("개인정보 수집 · 이용 동의가 필요합니다.");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch(SIGNUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          pet_name: form.petName,
          pet_breed: form.petBreed,
          area: form.area,
          walk_freq: form.walkFreq,
          intent: form.intent,
          consent_marketing: form.consentMarketing,
          source: "lunenlabs.com",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
    } catch (err) {
      console.warn("[signup] backend not reachable, falling back to mailto", err);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-white border border-aqua/30 rounded-3xl p-10 text-center shadow-xl">
        <div className="w-16 h-16 rounded-full bg-aqua/15 flex items-center justify-center mx-auto mb-5">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-aqua-dark"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-navy text-2xl font-bold mb-3">신청이 완료되었습니다</h3>
        <p className="text-mist mb-6 leading-relaxed">
          {form.name}님, 감사합니다. 2026년 6월 PetTracker V1.0 출시 시
          <br />
          가장 먼저 안내드리겠습니다.
        </p>
        <button
          onClick={() => {
            setForm(initialState);
            setStatus("idle");
          }}
          className="text-aqua-dark font-semibold text-sm hover:underline"
        >
          다른 신청 추가하기 →
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-line rounded-3xl p-7 sm:p-10 shadow-xl"
    >
      <h3 className="text-navy text-2xl sm:text-3xl font-bold mb-2">
        PetTracker 베타 사전가입
      </h3>
      <p className="text-mist text-sm mb-7">
        첫 3개월 무료 + 출시일 가장 먼저 안내. 약 1분 소요.
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

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Field
          label="강아지 이름 (선택)"
          value={form.petName}
          onChange={(v) => update("petName", v)}
          placeholder="콩이"
        />
        <Field
          label="견종 · 나이 (선택)"
          value={form.petBreed}
          onChange={(v) => update("petBreed", v)}
          placeholder="포메라니안 · 4세"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Field
          label="거주 지역 (선택)"
          value={form.area}
          onChange={(v) => update("area", v)}
          placeholder="서울 마포구"
        />
        <SelectField
          label="평소 산책 빈도"
          value={form.walkFreq}
          onChange={(v) => update("walkFreq", v)}
          options={[
            { v: "", l: "선택해주세요" },
            { v: "daily", l: "거의 매일" },
            { v: "3-5w", l: "주 3~5회" },
            { v: "1-2w", l: "주 1~2회" },
            { v: "rare", l: "거의 안 함" },
          ]}
        />
      </div>

      <div className="mb-6">
        <label className="block text-navy text-sm font-semibold mb-2">
          어떤 부분에 관심이 있나요? (선택)
        </label>
        <textarea
          value={form.intent}
          onChange={(e) => update("intent", e.target.value)}
          rows={3}
          placeholder="예) 출장 시 산책 위탁, 사고 신고 자동화, GPS 실시간 추적, AI 컨디션 리포트 등"
          className="w-full px-4 py-3 rounded-xl border border-line focus:border-aqua focus:ring-2 focus:ring-aqua/20 outline-none text-sm text-ink placeholder:text-mist/60 transition-all resize-none"
        />
      </div>

      <div className="space-y-3 mb-6 p-5 rounded-2xl bg-cream border border-line">
        <Checkbox
          checked={form.consentPrivacy}
          onChange={(v) => update("consentPrivacy", v)}
          required
        >
          <span className="text-sm text-ink">
            <strong>(필수)</strong> 개인정보 수집 · 이용에 동의합니다.{" "}
            <Link
              to="/privacy"
              className="text-aqua-dark underline underline-offset-2"
            >
              자세히 보기
            </Link>
          </span>
        </Checkbox>
        <Checkbox
          checked={form.consentMarketing}
          onChange={(v) => update("consentMarketing", v)}
        >
          <span className="text-sm text-ink">
            (선택) 출시 안내 및 베타 혜택 마케팅 정보 수신에 동의합니다.
          </span>
        </Checkbox>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
          {errorMsg}
        </div>
      )}

      {status === "error" ? (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-sm text-ink">
            네트워크 연결이 어려워 자동 전송에 실패했습니다.
            <br />
            <strong>아래 버튼</strong>을 누르면 본인의 이메일 앱으로
            신청 내용이 자동 작성되어 운영자에게 전송됩니다.
          </div>
          <a
            href={buildMailto()}
            className="block w-full py-4 rounded-xl bg-navy text-white font-semibold text-center hover:bg-navy-soft transition-colors"
          >
            이메일로 신청 보내기 →
          </a>
        </div>
      ) : (
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-navy to-aqua-dark text-white font-semibold hover:opacity-95 hover:scale-[1.005] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "전송 중..." : "사전가입 신청하기"}
        </button>
      )}

      <p className="mt-4 text-xs text-mist text-center">
        본 신청은 법적 구속력이 없으며, 출시 안내 외 목적으로 사용되지 않습니다.
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
      <label className="block text-navy text-sm font-semibold mb-2">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-line focus:border-aqua focus:ring-2 focus:ring-aqua/20 outline-none text-sm text-ink placeholder:text-mist/60 transition-all"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div>
      <label className="block text-navy text-sm font-semibold mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-line focus:border-aqua focus:ring-2 focus:ring-aqua/20 outline-none text-sm text-ink bg-white transition-all"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
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
        className="mt-0.5 w-4 h-4 accent-aqua-dark cursor-pointer shrink-0"
      />
      <span className="leading-relaxed">{children}</span>
    </label>
  );
}
