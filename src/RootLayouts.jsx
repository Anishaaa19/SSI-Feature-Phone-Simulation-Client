import React, { useEffect, useMemo, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import Navbar from "../Components/Navbar";
import SoftKeys from "../Components/Softkeys";
import Keypad from "../Components/Keypad";
import UssdGate from "../Components/UssdGate";
import { PhoneProvider, usePhone } from "../Phone/PhoneContext";

function Shell() {
    const location = useLocation();
    const navigate = useNavigate();
    const { setGlobalHandlers, setSoftKeys } = usePhone();
    const scrollRef = useRef(null);

    useEffect(() => {
        setGlobalHandlers({
            onEnd: async () => {
                const API = import.meta.env.VITE_API_BASE || "http://localhost:3000";
                const sessionId = sessionStorage.getItem("holder_session_id") || "";

                try {
                    if (sessionId) {
                        const res = await fetch(`${API}/api/user/end-session`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sessionId }),
                        });

                        const data = await res.json().catch(() => ({}));

                        if (!res.ok) {
                            throw new Error(data?.error || "Failed to end session");
                        }
                    }
                } catch (e) {
                    console.error("END session failed:", e);
                }

                sessionStorage.removeItem("holder_session_active");
                sessionStorage.removeItem("holder_session_expires_at");
                sessionStorage.removeItem("holder_user_phone");
                sessionStorage.removeItem("holder_session_id");
                navigate("/");
                window.location.reload();
            },
            onBack: () => {
                if (location.pathname.startsWith("/wallet")) navigate("/holder");
                else navigate("/holder");
            },
            onUp: () => scrollRef.current?.scrollBy({ top: -42, behavior: "smooth" }),
            onDown: () => scrollRef.current?.scrollBy({ top: 42, behavior: "smooth" }),
        });

        setSoftKeys({ left: "Menu", center: "OK", right: "Back" });
    }, [location.pathname, navigate, setGlobalHandlers, setSoftKeys]);

    const title = useMemo(() => {
        if (location.pathname === "/") return "Holder";
        if (location.pathname.startsWith("/holder")) return "Holder";
        if (location.pathname.startsWith("/wallet")) return "Wallet";
        return "SSI SIM";
    }, [location.pathname]);

    return (
        <div className="min-h-svh w-full flex items-center justify-center p-2 sm:p-4">
            <div
                className="
          w-90 max-w-[92vw]
          rounded-[36px]
          border
          shadow-[0_22px_60px_rgba(15,23,42,0.18)]
          overflow-hidden
        "
                style={{
                    background: "var(--phone-body)",
                    borderColor: "var(--phone-edge)",
                }}
            >
                <div className="h-6 sm:h-7 flex items-center justify-center">
                    <div
                        className="h-2 w-24 rounded-full"
                        style={{ background: "rgba(15,23,42,0.12)" }}
                    />
                </div>

                <Navbar title={title} />

                <div className="px-3 mt-2">
                    <div
                        className="rounded-[22px] border overflow-hidden"
                        style={{ background: "var(--screen-bg)", borderColor: "var(--line)" }}
                    >
                        <div className="h-72 sm:h-80 flex flex-col">
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-auto"
                                style={{ background: "linear-gradient(180deg, var(--screen-bg), var(--screen-tint))" }}
                            >
                                <UssdGate>
                                    <Outlet />
                                </UssdGate>
                            </div>

                            <div className="pb-2">
                                <SoftKeys />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-2 sm:mt-3">
                    <Keypad />
                </div>
            </div>
        </div>
    );
}

export default function RootLayouts() {
    return (
        <PhoneProvider>
            <Shell />
        </PhoneProvider>
    );
}