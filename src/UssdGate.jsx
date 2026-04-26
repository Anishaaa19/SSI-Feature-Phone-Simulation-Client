/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { usePhone } from "../Phone/PhoneContext";

const API = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const SESSION_MS = 5 * 60 * 1000;

const STAGES = {
  DIAL: "DIAL",
  MENU: "MENU",
  REGISTER_PHONE: "REGISTER_PHONE",
  REGISTER_PIN: "REGISTER_PIN",
  ENTER_PIN: "ENTER_PIN",
};

function Box({ title, hint, value, error }) {
  return (
    <div className="p-3">
      <div className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
        {title}
      </div>

      {hint ? (
        <div className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
          {hint}
        </div>
      ) : null}

      <div
        className="mt-3 rounded-2xl border p-3"
        style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.85)" }}
      >
        <div className="mt-1 text-[16px] font-mono tracking-widest break-all" style={{ color: "var(--text)" }}>
          {value || "____"}
        </div>
      </div>

      {error ? (
        <div
          className="mt-2 text-[11px] rounded-xl border px-2 py-2"
          style={{ borderColor: "rgba(251,113,133,0.45)", background: "var(--bad-weak)", color: "var(--text)" }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}

function MenuRow({ active, text, tone }) {
  const bg =
    active && tone === "good"
      ? "linear-gradient(90deg, var(--good-weak), rgba(16,185,129,0.0))"
      : active
        ? "linear-gradient(90deg, var(--accent-weak), rgba(14,165,233,0.0))"
        : "transparent";

  const left =
    active && tone === "good" ? "rgba(16,185,129,0.65)" : active ? "rgba(14,165,233,0.65)" : "transparent";

  return (
    <div
      className="px-3 py-2 text-[13px] border-b last:border-b-0"
      style={{
        background: bg,
        borderColor: "var(--line)",
        borderLeft: active ? `4px solid ${left}` : "4px solid transparent",
        color: "var(--text)",
      }}
    >
      {text}
    </div>
  );
}

export default function UssdGate({ children }) {
  const { setHandlers, setSoftKeys } = usePhone();
  const navigate = useNavigate();

  const [stage, setStage] = useState(STAGES.DIAL);
  const [dial, setDial] = useState("");
  const [menuIdx, setMenuIdx] = useState(0);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [entered, setEntered] = useState(false);

  const timerRef = useRef(null);
  const pinRef = useRef("");
  const phoneRef = useRef("");
  const dialRef = useRef("");

  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  useEffect(() => {
    phoneRef.current = phone;
  }, [phone]);

  useEffect(() => {
    dialRef.current = dial;
  }, [dial]);

  function resetSession() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    sessionStorage.removeItem("holder_session_active");
    sessionStorage.removeItem("holder_session_expires_at");
    sessionStorage.removeItem("holder_user_phone");
    sessionStorage.removeItem("holder_session_id");
    setEntered(false);
    setStage(STAGES.DIAL);
    setDial("");
    setPhone("");
    setPin("");
    setError("");
    setMenuIdx(0);
  }

  function startSession(phoneNumber, sessionId) {
    const expiresAt = Date.now() + SESSION_MS;
    sessionStorage.setItem("holder_session_active", "1");
    sessionStorage.setItem("holder_session_expires_at", String(expiresAt));
    sessionStorage.setItem("holder_user_phone", String(phoneNumber || ""));
    sessionStorage.setItem("holder_session_id", String(sessionId || ""));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      resetSession();
    }, SESSION_MS);
    setEntered(true);
    setError("");
  }

  useEffect(() => {
    const active = sessionStorage.getItem("holder_session_active");
    const expiresAt = Number(sessionStorage.getItem("holder_session_expires_at") || "0");
    const phoneNumber = sessionStorage.getItem("holder_user_phone") || "";

    if (active === "1" && expiresAt > Date.now()) {
      const remaining = expiresAt - Date.now();
      setEntered(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        resetSession();
      }, remaining);
      if (phoneNumber) sessionStorage.setItem("holder_user_phone", phoneNumber);
    } else {
      resetSession();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (entered) return;

    if (stage === STAGES.DIAL) {
      const submitDial = () => {
        const v = String(dialRef.current || "").trim();
        if (v === "*567#") {
          setError("");
          setStage(STAGES.MENU);
          setDial("");
          setMenuIdx(0);
          return;
        }
        setError("Invalid USSD code");
      };

      setSoftKeys({ left: "Del", center: "OK", right: "Clear" });
      setHandlers({
        onDigit: (d) => setDial((s) => (s.length < 16 ? s + String(d) : s)),
        onStar: () => setDial((s) => (s.length < 16 ? s + "*" : s)),
        onHash: () => setDial((s) => (s.length < 16 ? s + "#" : s)),
        onBackspace: () => setDial((s) => s.slice(0, -1)),
        onLeftSoft: () => setDial(""),
        onRightSoft: () => setDial((s) => s.slice(0, -1)),
        onOk: () => submitDial(),
        onCall: () => submitDial(),
      });
      return;
    }

    if (stage === STAGES.MENU) {
      const items = [
        { label: "1. Register", tone: "accent" },
        { label: "2. Enter", tone: "good" },
      ];

      setSoftKeys({ left: "Select", center: "OK", right: "Back" });
      setHandlers({
        onUp: () => setMenuIdx((v) => (v - 1 + items.length) % items.length),
        onDown: () => setMenuIdx((v) => (v + 1) % items.length),
        onDigit: (d) => {
          if (d === "1") {
            setError("");
            setPhone("");
            setPin("");
            setStage(STAGES.REGISTER_PHONE);
          }
          if (d === "2") {
            setError("");
            setPin("");
            setStage(STAGES.ENTER_PIN);
          }
        },
        onOk: () => {
          if (menuIdx === 0) {
            setError("");
            setPhone("");
            setPin("");
            setStage(STAGES.REGISTER_PHONE);
          } else {
            setError("");
            setPin("");
            setStage(STAGES.ENTER_PIN);
          }
        },
        onBack: () => {
          setStage(STAGES.DIAL);
          setError("");
          setDial("");
          setMenuIdx(0);
        },
        onRightSoft: () => {
          setStage(STAGES.DIAL);
          setError("");
          setDial("");
          setMenuIdx(0);
        },
      });
      return;
    }

    if (stage === STAGES.REGISTER_PHONE) {
      setSoftKeys({ left: "Del", center: "OK", right: "Clear" });
      setHandlers({
        onDigit: (d) => {
          if (!/^\d$/.test(String(d))) return;
          setPhone((s) => (s.length < 14 ? s + String(d) : s));
        },
        onBackspace: () => setPhone((s) => s.slice(0, -1)),
        onLeftSoft: () => setPhone(""),
        onRightSoft: () => setPhone((s) => s.slice(0, -1)),
        onOk: () => {
          const v = String(phoneRef.current || "").trim();
          if (!/^\d{8,14}$/.test(v)) {
            setError("Enter a valid mobile number");
            return;
          }
          setError("");
          setPin("");
          setStage(STAGES.REGISTER_PIN);
        },
        onBack: () => {
          setStage(STAGES.MENU);
          setError("");
        },
      });
      return;
    }

    if (stage === STAGES.REGISTER_PIN) {
      setSoftKeys({ left: "Del", center: "OK", right: "Clear" });
      setHandlers({
        onDigit: (d) => {
          if (!/^\d$/.test(String(d))) return;
          setPin((s) => (s.length < 6 ? s + String(d) : s));
        },
        onBackspace: () => setPin((s) => s.slice(0, -1)),
        onLeftSoft: () => setPin(""),
        onRightSoft: () => setPin((s) => s.slice(0, -1)),
        onOk: async () => {
          const phoneNumber = String(phoneRef.current || "").trim();
          const pinValue = String(pinRef.current || "").trim();

          if (!/^\d{8,14}$/.test(phoneNumber)) {
            setError("Enter a valid mobile number");
            setStage(STAGES.REGISTER_PHONE);
            return;
          }

          if (!/^\d{4,6}$/.test(pinValue)) {
            setError("PIN must be 4-6 digits");
            return;
          }

          try {
            const res = await fetch(`${API}/api/user/register`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phoneNumber, pin: pinValue }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Registration failed");
            startSession(phoneNumber, data?.sessionId || "");
            navigate("/holder");
          } catch (e) {
            setError(e.message);
          }
        },
        onBack: () => {
          setStage(STAGES.REGISTER_PHONE);
          setError("");
          setPin("");
        },
      });
      return;
    }

    if (stage === STAGES.ENTER_PIN) {
      setSoftKeys({ left: "Del", center: "OK", right: "Clear" });
      setHandlers({
        onDigit: (d) => {
          if (!/^\d$/.test(String(d))) return;
          setPin((s) => (s.length < 6 ? s + String(d) : s));
        },
        onBackspace: () => setPin((s) => s.slice(0, -1)),
        onLeftSoft: () => setPin(""),
        onRightSoft: () => setPin((s) => s.slice(0, -1)),
        onOk: async () => {
          const pinValue = String(pinRef.current || "").trim();

          if (!/^\d{4,6}$/.test(pinValue)) {
            setError("Enter your PIN");
            return;
          }

          try {
            const res = await fetch(`${API}/api/user/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pin: pinValue }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Enter failed");
            startSession(data?.phoneNumber || "", data?.sessionId || "");
            navigate("/holder");
          } catch (e) {
            setError(e.message);
          }
        },
        onBack: () => {
          setStage(STAGES.MENU);
          setError("");
          setPin("");
        },
      });
    }
  }, [entered, menuIdx, setHandlers, setSoftKeys, stage]);

  if (entered) return children;

  if (stage === STAGES.DIAL) {
    return <Box title="Enter USSD" hint="" value={dial} error={error} />;
  }

  if (stage === STAGES.MENU) {
    const items = [
      { label: "1. Register", tone: "accent" },
      { label: "2. Start", tone: "good" },
    ];

    return (
      <div className="p-3">
        <div className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
          Welcome
        </div>

        <div className="mt-3 rounded-2xl border overflow-hidden font-semibold" style={{ borderColor: "var(--line)" }}>
          {items.map((it, i) => (
            <MenuRow key={it.label} active={i === menuIdx} text={it.label} tone={it.tone} />
          ))}
        </div>

        {error ? (
          <div
            className="mt-2 text-[11px] rounded-xl border px-2 py-2"
            style={{ borderColor: "rgba(251,113,133,0.45)", background: "var(--bad-weak)", color: "var(--text)" }}
          >
            {error}
          </div>
        ) : null}
      </div>
    );
  }

  if (stage === STAGES.REGISTER_PHONE) {
    return <Box title="Enter mobile number" hint="" value={phone} error={error} />;
  }

  if (stage === STAGES.REGISTER_PIN) {
    return <Box title="Set your PIN" hint="" value={pin.length ? "•".repeat(pin.length) : ""} error={error} />;
  }

  return <Box title="Enter your PIN" hint="" value={pin.length ? "•".repeat(pin.length) : ""} error={error} />;
}