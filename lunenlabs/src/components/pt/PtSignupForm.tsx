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

export default function PtSignupForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const buildMailto = () => {
    const subject = encodeURIComponent(`[PT 사전가입 · /pet] ${form.name || "익명"}`);
    const body = encodeURIComponent(
      [
        `이름: ${form.name}`,
        `이메일: ${form.email}`,
        `강아지 이름: ${form.petName || "-"}`,
        `견종: ${form.petBreed || "-"}`,
        `지역: ${form.area || "-"}`,
        `산책 빈도: ${form.walkFreq || "-"}`,
        `사용 의향: ${form.intent || "-"}`,
        `마케팅 수신 동의: ${form.consentMarketing ? "Y" : "N"}`,
        "",
        "(본 신청은 lunenlabs.com/pet 사전가입 폼에서 mailto fallback으로 전송됨)",
      ].join("\n")
    );
    return `mailto:${FALLBACK_EMAIL}?subject=${subject}&body=${body}`;
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
          source: "lunenlabs.com/pet",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
    } catch (err) {
      console.warn("[pt-signup] backend not reachable, falling back to mailto", err);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-white border border-pt-orange/30 rounded-3xl p-10 text-center shadow-xl">
        <div className="w-16 h-16 rounded-full bg-pt-orange-light flex items-center justify-center mx-auto mb-5">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-pt-orange-dark"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="font-pt-heading text-pt-ink text-2xl font-bold mb-3">
          신청 완료됐어요 🎉
        </h3>
        <p className="text-pt-ink-soft mb-2 leading-relaxed">
          {form.name}님, 감사해요.
        </p>
        <p className="text-pt-ink-soft mb-6 leading-relaxed">
          2026년 6월 PetTracker V1.0이 출시되면
          <br />
          가장 먼저 알려드릴게요.
        </p>
        <button
          onClick={() => {
            setForm(initialState);
            setStatus("idle");
          }}
          className="text-pt-orange-dark font-semibold text-sm hover:underline"
        >
          다른 신청도 추가해보기 →
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-pt-border rounded-3xl p-7 sm:p-10 shadow-xl"
    >
      <h3 className="font-pt-heading text-pt-ink text-2xl sm:text-3xl font-bold mb-2">
        PetTracker 베타 사전가입
      </h3>
      <p className="text-pt-ink-soft text-sm mb-7">
        첫 3개월 완전 무료 + 출시일 가장 먼저 안내드려요. 1분이면 신청이 끝나요.
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
            { v: "rare", l: "거의 안 해요" },
          ]}
        />
      </div>

      <div className="mb-6">
        <label className="block text-pt-ink text-sm font-semibold mb-2">
          어떤 부분에 관심이 있으세요? (선택)
        </label>
        <textarea
          value={form.intent}
          onChange={(e) => update("intent", e.target.value)}
          rows={3}
          placeholder="예) 출장 때 산책 부탁 / 사고 자동 신고 / GPS 실시간 추적 / AI 컨디션 리포트"
          className="w-full px-4 py-3 rounded-xl border border-pt-border focus:border-pt-orange focus:ring-2 focus:ring-pt-orange/20 outline-none text-sm text-pt-ink placeholder:text-pt-ink-soft/60 transition-all resize-none bg-white"
        />
      </div>

      <div className="space-y-3 mb-6 p-5 rounded-2xl bg-pt-cream border border-pt-border">
        <Checkbox
          checked={form.consentPrivacy}
          onChange={(v) => update("consentPrivacy", v)}
          required
        >
          <span className="text-sm text-pt-ink">
            <strong>(필수)</strong> 개인정보 수집 · 이용에 동의해요.{" "}
            <Link
              to="/privacy"
              className="text-pt-orange-dark underline underline-offset-2"
            >
              자세히 보기
            </Link>
          </span>
        </Checkbox>
        <Checkbox
          checked={form.consentMarketing}
          onChange={(v) => update("consentMarketing", v)}
        >
          <span className="text-sm text-pt-ink">
            (선택) 출시 안내·베타 혜택 같은 마케팅 정보 수신에 동의해요.
          </span>
        </Checkbox>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {status === "error" ? (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-pt-orange-light border border-pt-orange/30 text-sm text-pt-ink">
            잠깐, 자동 전송이 안 됐어요. 아래 버튼을 누르시면 본인의 이메일 앱으로
            신청 내용이 자동 작성돼서 운영자에게 전달돼요.
          </div>
          <a
            href={buildMailto()}
            className="block w-full py-4 rounded-xl bg-pt-orange-dark text-white font-semibold text-center hover:bg-pt-ink transition-colors"
          >
            이메일로 신청 보내기 →
          </a>
        </div>
      ) : (
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full py-4 rounded-xl bg-pt-orange text-white font-semibold hover:bg-pt-orange-dark hover:scale-[1.005] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pt-orange/30"
        >
          {status === "submitting" ? "전송 중..." : "사전가입 신청하기"}
        </button>
      )}

      <p className="mt-4 text-xs text-pt-ink-soft text-center">
        법적 구속력이 있는 신청이 아니에요. 출시 안내 외 목적으로 사용되지 않아요.
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
      <label className="block text-pt-ink text-sm font-semibold mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-pt-border focus:border-pt-orange focus:ring-2 focus:ring-pt-orange/20 outline-none text-sm text-pt-ink placeholder:text-pt-ink-soft/60 transition-all bg-white"
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
      <label className="block text-pt-ink text-sm font-semibold mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-pt-border focus:border-pt-orange focus:ring-2 focus:ring-pt-orange/20 outline-none text-sm text-pt-ink bg-white transition-all"
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
        className="mt-0.5 w-4 h-4 accent-pt-orange-dark cursor-pointer shrink-0"
      />
      <span className="leading-relaxed">{children}</span>
    </label>
  );
}
