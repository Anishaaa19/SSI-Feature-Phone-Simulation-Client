import React, { useEffect } from "react";
import { usePhone } from "../Phone/PhoneContext";

function Key({ label, sub, onClick, className = "" }) {
    const prevent = (e) => e.preventDefault();

    return (
        <button
            type="button"
            onPointerDown={prevent}
            onMouseDown={prevent}
            onClick={onClick}
            className={
                "select-none rounded-2xl border h-11 sm:h-12 flex flex-col items-center justify-center " +
                "text-[15px] font-bold leading-none " +
                "shadow-[0_10px_18px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.8)] " +
                "active:translate-y-px " +
                className
            }
            style={{
                background: "var(--key)",
                borderColor: "var(--key-edge)",
                color: "var(--text)",
            }}
        >
            <div>{label}</div>
            {sub ? (
                <div
                    className="text-[10px] font-semibold mt-1"
                    style={{ color: "var(--muted)" }}
                >
                    {sub}
                </div>
            ) : null}
        </button>
    );
}

function MiniKey({ label, onClick, className = "", tone = "normal" }) {
    const prevent = (e) => e.preventDefault();

    const bg =
        tone === "warn"
            ? "linear-gradient(180deg, #fff7ed, #fffbeb)"
            : tone === "danger"
                ? "linear-gradient(180deg, #fff1f2, #ffe4e6)"
                : "linear-gradient(180deg, #ffffff, #f8fafc)";

    const border =
        tone === "warn"
            ? "rgba(245,158,11,0.35)"
            : tone === "danger"
                ? "rgba(251,113,133,0.35)"
                : "var(--line)";

    return (
        <button
            type="button"
            onPointerDown={prevent}
            onMouseDown={prevent}
            onClick={onClick}
            className={
                "select-none rounded-2xl border h-8 sm:h-9 flex items-center justify-center " +
                "text-[12px] font-semibold tracking-wide " +
                "shadow-[0_10px_18px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] " +
                "active:translate-y-px " +
                className
            }
            style={{
                background: bg,
                borderColor: border,
                color: "var(--text)",
            }}
        >
            {label}
        </button>
    );
}

function NavKey({
    label,
    onClick,
    className = "",
    style = {},
    ariaLabel,
}) {
    const prevent = (e) => e.preventDefault();

    return (
        <button
            type="button"
            onPointerDown={prevent}
            onMouseDown={prevent}
            onClick={onClick}
            className={
                "select-none rounded-xl border h-7 w-9 sm:h-8 sm:w-10 flex items-center justify-center " +
                "text-[11px] font-bold " +
                "shadow-[0_10px_18px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] " +
                "active:translate-y-px " +
                className
            }
            style={{
                background: "linear-gradient(180deg, #ffffff, #f8fafc)",
                borderColor: "var(--line)",
                color: "var(--text)",
                ...style,
            }}
            aria-label={ariaLabel || label}
            title={ariaLabel || label}
        >
            {label}
        </button>
    );
}

export default function Keypad() {
    const { fire } = usePhone();

    useEffect(() => {
        const onKeyDown = (e) => {
            const k = e.key;

            if (k === "ArrowUp") {
                e.preventDefault();
                return fire("onUp");
            }
            if (k === "ArrowDown") {
                e.preventDefault();
                return fire("onDown");
            }
            if (k === "ArrowLeft") {
                e.preventDefault();
                return fire("onLeft");
            }
            if (k === "ArrowRight") {
                e.preventDefault();
                return fire("onRight");
            }
            if (k === "Enter") {
                e.preventDefault();
                return fire("onOk");
            }
            if (k === "Backspace" || k === "Delete") {
                e.preventDefault();
                return fire("onBackspace");
            }
            if (k === "Escape") {
                e.preventDefault();
                return fire("onBack");
            }

            if (/^[0-9]$/.test(k)) return fire("onDigit", k);
            if (k === "*") return fire("onStar");
            if (k === "#") return fire("onHash");
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [fire]);

    return (
        <div className="px-3 pb-3 sm:pb-4">
            <div className="mb-2 grid grid-cols-3 gap-1.5 sm:gap-2 items-start">
                <MiniKey label="⌫ DELETE" onClick={() => fire("onBackspace")} />

                <div className="flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                        <NavKey label="▲" ariaLabel="Up" onClick={() => fire("onUp")} className="-my-1" />
                        <div className="flex items-center gap-1 sm:gap-1">
                            <NavKey label="◀" ariaLabel="Left" onClick={() => fire("onLeft")} />
                            <NavKey
                                label="OK"
                                ariaLabel="OK"
                                onClick={() => fire("onOk")}
                                className="h-8 w-12 sm:h-9 sm:w-14 text-[13px] sm:text-[15px] font-extrabold tracking-wide"
                                style={{
                                    background: "linear-gradient(180deg, #ffb703, #fb8500)",
                                    borderColor: "rgba(194,65,12,0.95)",
                                    color: "#ffffff",
                                    boxShadow:
                                        "0_12px_22px_rgba(251,133,0,0.35), inset_0_1px_0_rgba(255,255,255,0.35)",
                                }}
                            />
                            <NavKey label="▶" ariaLabel="Right" onClick={() => fire("onRight")} />
                        </div>
                        <NavKey label="▼" ariaLabel="Down" onClick={() => fire("onDown")} className="-my-1" />
                    </div>
                </div>

                <MiniKey label="CLEAR" tone="warn" onClick={() => fire("onClear")} />
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <Key label="1" sub="" onClick={() => fire("onDigit", "1")} />
                <Key label="2" sub="ABC" onClick={() => fire("onDigit", "2")} />
                <Key label="3" sub="DEF" onClick={() => fire("onDigit", "3")} />
                <Key label="4" sub="GHI" onClick={() => fire("onDigit", "4")} />
                <Key label="5" sub="JKL" onClick={() => fire("onDigit", "5")} />
                <Key label="6" sub="MNO" onClick={() => fire("onDigit", "6")} />
                <Key label="7" sub="PQRS" onClick={() => fire("onDigit", "7")} />
                <Key label="8" sub="TUV" onClick={() => fire("onDigit", "8")} />
                <Key label="9" sub="WXYZ" onClick={() => fire("onDigit", "9")} />
                <Key label="*" sub="" onClick={() => fire("onStar")} />
                <Key label="0" sub="+" onClick={() => fire("onDigit", "0")} />
                <Key label="#" sub="" onClick={() => fire("onHash")} />

                <button
                    type="button"
                    onClick={() => fire("onCall")}
                    className="col-span-1 rounded-2xl border h-11 sm:h-12 font-bold shadow-[0_12px_20px_rgba(15,23,42,0.10)] active:translate-y-px"
                    style={{
                        background: "linear-gradient(180deg, var(--good-weak), #ffffff)",
                        borderColor: "rgba(16,185,129,0.40)",
                        color: "var(--text)",
                    }}
                >
                    CALL
                </button>

                <button
                    type="button"
                    onClick={() => fire("onBack")}
                    className="col-span-1 rounded-2xl border h-11 sm:h-12 font-bold shadow-[0_12px_20px_rgba(15,23,42,0.10)] active:translate-y-px"
                    style={{
                        background: "linear-gradient(180deg, #ffffff, #f8fafc)",
                        borderColor: "var(--line)",
                        color: "var(--text)",
                    }}
                >
                    BACK
                </button>

                <button
                    type="button"
                    onClick={() => fire("onEnd")}
                    className="col-span-1 rounded-2xl border h-11 sm:h-12 font-bold shadow-[0_12px_20px_rgba(15,23,42,0.10)] active:translate-y-px"
                    style={{
                        background: "linear-gradient(180deg, var(--bad-weak), #ffffff)",
                        borderColor: "rgba(251,113,133,0.45)",
                        color: "var(--text)",
                    }}
                >
                    END
                </button>
            </div>
        </div>
    );
}