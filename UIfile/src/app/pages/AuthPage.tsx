import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, ArrowRight, CheckSquare } from "lucide-react";
import { DISPLAY, BODY } from "../data";

function CheckeredStrip({ cols = 16 }: { cols?: number }) {
  return (
    <div className="flex h-2" aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1" style={{ background: i % 2 === 0 ? "#e8002d" : "#ffffff" }} />
      ))}
    </div>
  );
}

function SpeedLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" fill="none" aria-hidden="true">
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={i} x1={-40+i*60} y1="0" x2={-40+i*60+280} y2="300"
          stroke="white" strokeWidth={i%3===0?"2":"1"} strokeOpacity={i%3===0?"0.06":"0.03"} />
      ))}
    </svg>
  );
}

function Field({ label, id, type, autoComplete, value, onChange, placeholder, required }: {
  label: string; id: string; type: string; autoComplete?: string;
  value: string; onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs text-muted-foreground"
        style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </label>
      <input id={id} type={type} autoComplete={autoComplete} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        className="w-full text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-all duration-200"
        style={{ fontFamily: BODY, fontWeight: 300, background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)", padding: "0.75rem 1rem", borderRadius: 0 }}
        onFocus={e => (e.currentTarget.style.borderColor = "#e8002d")}
        onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
    </div>
  );
}

function PasswordField({ label, id, value, onChange, show, onToggle, placeholder, required }: {
  label: string; id: string; value: string; onChange: React.ChangeEventHandler<HTMLInputElement>;
  show: boolean; onToggle: () => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs text-muted-foreground"
        style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} value={value} onChange={onChange}
          placeholder={placeholder} required={required}
          className="w-full text-sm text-foreground placeholder-muted-foreground/40 outline-none pr-11 transition-all duration-200"
          style={{ fontFamily: BODY, fontWeight: 300, background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)", padding: "0.75rem 1rem", borderRadius: 0 }}
          onFocus={e => (e.currentTarget.style.borderColor = "#e8002d")}
          onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/dashboard"); }, 1200);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden px-4 py-12"
      style={{ fontFamily: BODY }}>
      <SpeedLines />
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(232,0,45,0.18) 0%, transparent 70%)" }} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md border border-border overflow-hidden" style={{ background: "#141418" }}>
        <CheckeredStrip cols={16} />
        <div className="h-1 bg-primary" />

        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 bg-primary text-white">
              <CheckSquare size={18} strokeWidth={2.5} />
            </div>
            <span className="text-foreground tracking-tight leading-none"
              style={{ fontFamily: DISPLAY, fontSize: "2.2rem", fontWeight: 900 }}>
              Queue<span className="text-primary">T</span>
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-1 ml-12"
            style={{ fontFamily: DISPLAY, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Task management · Pit-stop fast
          </p>
        </div>

        <div className="px-8 mb-6">
          <div className="grid grid-cols-2 border border-border">
            {(["signin", "signup"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="py-2.5 text-xs transition-all duration-200"
                style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase",
                  background: tab === t ? "#e8002d" : "transparent", color: tab === t ? "#fff" : "#7a7a8c" }}>
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-primary text-xs" style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.15em" }}>
              SECTOR {tab === "signin" ? "01" : "02"}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {tab === "signup" && <Field label="Full Name" id="name" type="text" autoComplete="name" value={form.name} onChange={set("name")} placeholder="Lewis Hamilton" required />}
          <Field label="Email Address" id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="driver@team.com" required />
          <PasswordField label="Password" id="password" value={form.password} onChange={set("password")} show={showPass} onToggle={() => setShowPass(v => !v)} placeholder="Min. 8 characters" required />
          {tab === "signup" && <PasswordField label="Confirm Password" id="confirm" value={form.confirm} onChange={set("confirm")} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} placeholder="Repeat password" required />}

          {tab === "signin" && (
            <div className="flex justify-between items-center pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="accent-primary w-3 h-3" />
                <span className="text-xs text-muted-foreground" style={{ fontWeight: 300 }}>Stay in the race</span>
              </label>
              <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors" style={{ fontWeight: 300 }}>Forgot password?</a>
            </div>
          )}
          {tab === "signup" && (
            <label className="flex items-start gap-2 cursor-pointer select-none pt-1">
              <input type="checkbox" className="accent-primary w-3 h-3 mt-0.5 flex-shrink-0" required />
              <span className="text-xs text-muted-foreground leading-relaxed" style={{ fontWeight: 300 }}>
                I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </span>
            </label>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white flex items-center justify-center gap-2 py-3.5 mt-2 transition-opacity hover:opacity-85 disabled:opacity-50 relative overflow-hidden"
            style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: "1rem", letterSpacing: "0.12em" }}>
            <span className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)" }} aria-hidden="true" />
            {loading ? (
              <span className="flex items-center gap-2 relative z-10">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {tab === "signin" ? "ENTERING GRID…" : "CREATING ACCOUNT…"}
              </span>
            ) : (
              <span className="flex items-center gap-2 relative z-10">
                {tab === "signin" ? "RACE TO DASHBOARD" : "JOIN THE GRID"}
                <ArrowRight size={16} strokeWidth={2.5} />
              </span>
            )}
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-muted-foreground" style={{ background: "#141418", fontFamily: DISPLAY, fontWeight: 300 }}>OR</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {["Google", "GitHub"].map(p => (
              <button key={p} type="button" className="border border-border text-foreground text-xs py-2.5 tracking-widest uppercase hover:border-primary/60 hover:text-primary transition-all"
                style={{ fontFamily: DISPLAY, fontWeight: 700, letterSpacing: "0.12em" }}>
                {p}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground pt-2" style={{ fontWeight: 300 }}>
            {tab === "signin" ? (
              <>New to QueueT?{" "}<button type="button" onClick={() => setTab("signup")} className="text-primary hover:underline font-medium">Create an account</button></>
            ) : (
              <>Already racing?{" "}<button type="button" onClick={() => setTab("signin")} className="text-primary hover:underline font-medium">Sign in</button></>
            )}
          </p>
        </form>

        <CheckeredStrip cols={16} />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-muted-foreground pointer-events-none select-none" aria-hidden="true">
        {["LAP 1/∞", "SECTOR 1", "DRS OPEN"].map(l => (
          <span key={l} style={{ fontFamily: DISPLAY, fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.15em" }}>{l}</span>
        ))}
      </div>
    </div>
  );
}
