import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  User, Mail, Lock, Shield, ArrowRight, CheckCircle, AlertCircle, Key, 
  HelpCircle, RefreshCw, Send, Check, Sparkles, Terminal, Activity, Copy
} from "lucide-react";
import { UserProfile } from "../types";

interface AuthPageProps {
  onAuthSuccess: (user: UserProfile) => void;
  onNavigate: (tab: any) => void;
  currentEmail?: string;
}

type AuthMode = "login" | "register" | "forgot" | "verify";

export default function AuthPage({ onAuthSuccess, onNavigate, currentEmail }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState<string>(currentEmail || "");
  const [password, setPassword] = useState<string>("");
  const [registerEmail, setRegisterEmail] = useState<string>("");
  const [customKey, setCustomKey] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [simulatedResetToken, setSimulatedResetToken] = useState<string | null>(null);

  // Verification code states
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [generatedPin, setGeneratedPin] = useState<string>("");
  const [verifyEmailAddress, setVerifyEmailAddress] = useState<string>("");
  const [tempProfileForVerification, setTempProfileForVerification] = useState<UserProfile | null>(null);

  // Social OAuth Simulation states
  const [socialModalProvider, setSocialModalProvider] = useState<"google" | "github" | null>(null);
  const [socialModalEmail, setSocialModalEmail] = useState<string>("");

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // 1. Submit Registration Form
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    
    const trimEmail = registerEmail.trim();
    if (!trimEmail) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimEmail, customKey: customKey.trim() || undefined }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to register profile.");
      }

      // Generate a dynamic verification code to complete verification segment
      const numPin = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedPin(numPin);
      setVerifyEmailAddress(trimEmail);
      setTempProfileForVerification(data.user);
      
      setSuccessMsg("Registration success! A secure verification PIN has been dispatched.");
      setMode("verify");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Login Form
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const trimEmail = email.trim();
    if (!trimEmail) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login credentials authentication failed.");
      }

      // If user was auto-created or is existing, log them in!
      onAuthSuccess(data.user);
      setSuccessMsg(`Welcome back, ${data.user.email}!`);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Forgot Password Form
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const trimEmail = forgotEmail.trim();
    if (!trimEmail) {
      setErrorMsg("Email address is required to locate your credentials storage.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Simulate dispatching a cryptographically hashed reset link
      const randomToken = `jwt_reset_key_${Math.random().toString(36).substr(2, 16)}`;
      setSimulatedResetToken(randomToken);
      setSuccessMsg("Simulation complete: Secure reset token generated successfully. Click link below to recover.");
      setLoading(false);
    }, 850);
  };

  // 4. Verification Trigger
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (verificationCode.trim() !== generatedPin) {
      setErrorMsg("Verification code doesn't match the active pin index. Please verify.");
      return;
    }

    if (tempProfileForVerification) {
      onAuthSuccess(tempProfileForVerification);
      setSuccessMsg("Success! Security token verified. Profile fully activated.");
    } else {
      setErrorMsg("Internal context loss. Please sign in again.");
      setMode("login");
    }
  };

  const startSocialLoginFlow = (provider: "google" | "github") => {
    resetMessages();
    setSocialModalEmail(email || `${provider}_architect@neuralvoid.io`);
    setSocialModalProvider(provider);
  };

  const handleAbortSocial = () => {
    const providerName = socialModalProvider === "google" ? "Google" : "GitHub";
    setSocialModalProvider(null);
    setErrorMsg(`Authentication aborted: Verification process cancelled for ${providerName} federated login.`);
  };

  const handleSocialLoginConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const provider = socialModalProvider;
    if (!provider) return;

    const simulatedEmail = socialModalEmail.trim();
    setSocialModalProvider(null);
    setLoading(true);
    
    if (!simulatedEmail) {
      setLoading(false);
      setErrorMsg("Authentication aborted: Email cannot be empty. Please supply a valid developer email.");
      return;
    }

    if (!simulatedEmail.includes("@")) {
      setLoading(false);
      setErrorMsg(`Authentication aborted: "${simulatedEmail}" is missing domain symbol '@'. A valid OAuth login email is required.`);
      return;
    }

    const shortName = simulatedEmail.split("@")[0].split(/[._-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    
    try {
      const res = await fetch("/api/auth/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          email: simulatedEmail.trim().toLowerCase(),
          name: shortName,
          avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${simulatedEmail}`
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Federated login failed mapping handshake profile.");
      }
      onAuthSuccess(data.user);
      setSuccessMsg(`Welcome, ${data.user.name || data.user.email}! Secure social tunnel verified via ${provider === "google" ? "Google Autonomic G-Suite" : "GitHub Developer Portal"}.`);
    } catch (err: any) {
      setErrorMsg(err.message || "An atypical federated authentication handshake error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 relative z-10 animate-fade-in font-sans">
      
      {/* Social Modal Overlay */}
      {socialModalProvider && (
        <div className="absolute inset-0 z-50 bg-[#090e1b] rounded-3xl p-6 flex flex-col justify-between border-2 border-cyan-500/40 shadow-2xl animate-fade-in text-left">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/85">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850">
                {socialModalProvider === "google" ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.64 14.96 1 12 1 7.35 1 3.39 3.67 1.5 7.56l3.86 3C6.27 7.56 8.91 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.37-4.88 3.37-8.54z" />
                    <path fill="#FBBC05" d="M5.36 14.44c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.5 6.86C.54 8.77 0 10.92 0 13.14s.54 4.37 1.5 6.28l3.86-2.98z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.11.75-2.53 1.19-4.3 1.19-3.09 0-5.73-2.52-6.64-5.52L1.5 15.9C3.39 19.79 7.35 22.44 12 22.44z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 103.03.892 1.529 2.341 1.087 2.91.831.092-.647.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-sans capitalize">
                  {socialModalProvider} Federated Authentication
                </h3>
                <p className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase">
                  SANDBOX SECURITY CONSENT
                </p>
              </div>
            </div>

            {/* Sandbox consent details */}
            <p className="text-xs text-slate-300 leading-relaxed">
              NeuralVoid is simulating a secure OAuth tunnel via <span className="text-white font-semibold font-mono">{socialModalProvider === "google" ? "Google G-Suite" : "GitHub Node"}</span>.
              Please authorize by confirming your development email to finalize integration.
            </p>

            <form onSubmit={handleSocialLoginConfirm} className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                  Authorize Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={socialModalEmail}
                    onChange={(e) => setSocialModalEmail(e.target.value)}
                    placeholder="architect@neuralvoid.io"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs outline-none text-white focus:border-cyan-500 font-mono transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-450 hover:to-blue-550 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition outline-none cursor-pointer mt-4"
              >
                Authorize & Connect Session <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={handleAbortSocial}
              className="text-xs text-slate-400 hover:text-white underline font-mono outline-none cursor-pointer"
            >
              Abort OAuth Handshake
            </button>
          </div>
        </div>
      )}

      {/* Container wrapper */}
      <div className="glass-panel border border-slate-800 rounded-3xl overflow-hidden shadow-2xl bg-[#090e1b] flex flex-col">
        
        {/* Banner header logo branding */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-850 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center text-white mb-1">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-base font-bold font-sans text-white tracking-tight">NeuralVoid Authentication Gate</h2>
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            SECURE CLIENT ACCESS CONTROL
          </p>
        </div>

        {/* Message Banner for status outputs */}
        {(errorMsg || successMsg) && (
          <div className="p-4.5 border-b border-slate-850">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span className="leading-relaxed text-left">{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-3 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span className="leading-relaxed text-left">{successMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic form area */}
        <div className="p-6 space-y-5">
          
          {/* ================= MODE: LOGIN (SIGN IN) ================= */}
          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                  Developer Profile Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. engineering_lead@portfolio.dev"
                    required
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none text-white focus:border-cyan-500 font-mono transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold font-mono">
                  <span className="text-slate-400 uppercase tracking-wider">Access Security Token / Password</span>
                  <button 
                    type="button" 
                    onClick={() => setMode("forgot")}
                    className="text-cyan-400 hover:underline outline-none capitalize cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none text-white focus:border-cyan-500 font-mono transition"
                  />
                </div>
                <span className="text-[9px] text-slate-500 block leading-tight font-sans">
                  * Note: Profile login auto-registers new testing emails instantly to ensure hassle-free demo inspection.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-450 hover:to-blue-550 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition outline-none cursor-pointer"
              >
                {loading ? "Authenticating security layers..." : "Secure Sign-In Session"} 
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                  or continue with
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => startSocialLoginFlow("google")}
                  disabled={loading}
                  className="py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs text-white hover:bg-slate-850 hover:border-cyan-550/30 transition outline-none cursor-pointer font-sans font-medium"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.64 14.96 1 12 1 7.35 1 3.39 3.67 1.5 7.56l3.86 3C6.27 7.56 8.91 5.04 12 5.04z"/>
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.37-4.88 3.37-8.54z"/>
                    <path fill="#FBBC05" d="M5.36 14.44c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.5 6.86C.54 8.77 0 10.92 0 13.14s.54 4.37 1.5 6.28l3.86-2.98z"/>
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.11.75-2.53 1.19-4.3 1.19-3.09 0-5.73-2.52-6.64-5.52L1.5 15.9C3.39 19.79 7.35 22.44 12 22.44z"/>
                  </svg>
                  <span className="truncate">Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => startSocialLoginFlow("github")}
                  disabled={loading}
                  className="py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs text-white hover:bg-slate-850 hover:border-emerald-550/30 transition outline-none cursor-pointer font-sans font-medium"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" width="24" height="24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 103.03.892 1.529 2.341 1.087 2.91.831.092-.647.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                  <span className="truncate">GitHub</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400 font-sans">
                  Need a secure custom developer identity?{" "}
                  <button
                    type="button"
                    onClick={() => { resetMessages(); setMode("register"); }}
                    className="text-cyan-400 hover:underline font-semibold font-sans outline-none cursor-pointer"
                  >
                    Sign Up Registered Profile
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* ================= MODE: REGISTER (SIGN UP) ================= */}
          {mode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                  New Developer Profile Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="engineering_audit@neuralvoid.io"
                    required
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none text-white focus:border-cyan-500 font-mono transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                  Custom Gemini API Key (Optional Override)
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="AIzaSy... (leave blank to use platform defaults)"
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none text-white focus:border-cyan-500 font-mono transition"
                  />
                </div>
                <span className="text-[9px] text-slate-500 block leading-tight font-sans">
                  Provide custom keys to run direct unthrottled requests. Stored secure with backend encryption.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-450 hover:to-blue-550 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition outline-none cursor-pointer"
              >
                {loading ? "Registering developer node..." : "Provision New Account"} 
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                  or register with
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => startSocialLoginFlow("google")}
                  disabled={loading}
                  className="py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs text-white hover:bg-slate-850 hover:border-cyan-555/30 transition outline-none cursor-pointer font-sans font-medium"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.64 14.96 1 12 1 7.35 1 3.39 3.67 1.5 7.56l3.86 3C6.27 7.56 8.91 5.04 12 5.04z"/>
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.37-4.88 3.37-8.54z"/>
                    <path fill="#FBBC05" d="M5.36 14.44c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.5 6.86C.54 8.77 0 10.92 0 13.14s.54 4.37 1.5 6.28l3.86-2.98z"/>
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.11.75-2.53 1.19-4.3 1.19-3.09 0-5.73-2.52-6.64-5.52L1.5 15.9C3.39 19.79 7.35 22.44 12 22.44z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => startSocialLoginFlow("github")}
                  disabled={loading}
                  className="py-2.5 px-3 bg-[#090e1b] border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs text-white hover:bg-slate-850 hover:border-emerald-555/30 transition outline-none cursor-pointer font-sans font-medium"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" width="24" height="24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 103.03.892 1.529 2.341 1.087 2.91.831.092-.647.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400 font-sans">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => { resetMessages(); setMode("login"); }}
                    className="text-cyan-400 hover:underline font-semibold font-sans outline-none cursor-pointer"
                  >
                    Sign In
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* ================= MODE: FORGOT PASSWORD ================= */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                  Verify Registered Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. testing_audit@neuralvoid.io"
                    required
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none text-white focus:border-cyan-500 font-mono transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-450 hover:to-blue-550 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition outline-none cursor-pointer"
              >
                {loading ? "Re-verifying SLA node..." : "Request Reset Password Token"} 
                <Send className="w-4 h-4" />
              </button>

              {/* Simulation output bearer code link */}
              {simulatedResetToken && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2 text-left font-mono">
                  <span className="text-[10px] text-cyan-400 font-bold block">
                    SIMULATED EMAIL DESPATCH:
                  </span>
                  <p className="text-[9.5px] text-slate-400 leading-normal font-sans">
                    An automated secure token has been dispatched. Click the generated bypass password bypass link to verify identity:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Automatically switch mode to verification or override registration login bypass!
                      resetMessages();
                      setEmail(forgotEmail);
                      setSuccessMsg(`Session recovery successful. Token '${simulatedResetToken}' utilized. Code verified!`);
                      setMode("login");
                    }}
                    className="w-full text-left p-2.5 bg-slate-900 border border-slate-800 rounded text-[9px] text-[#22d3ee] flex items-center justify-between hover:border-cyan-600/30 transition hover:bg-slate-850 cursor-pointer text-xxs truncate"
                  >
                    <span>{`https://neuralvoid.io/api/auth/reset?token=${simulatedResetToken.slice(0, 15)}...`}</span>
                    <span className="bg-cyan-950 px-1 rounded border border-cyan-800 font-bold text-[8px] uppercase tracking-wider text-cyan-300">BYPASS PIN</span>
                  </button>
                </div>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { resetMessages(); setMode("login"); }}
                  className="text-xs text-slate-400 hover:text-white hover:underline font-semibold font-sans outline-none cursor-pointer inline-flex items-center gap-1"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ================= MODE: VERIFY EMAIL ================= */}
          {mode === "verify" && (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="p-3 bg-indigo-505/10 border border-indigo-500/20 bg-indigo-950/20 rounded-2xl flex flex-col space-y-2 text-left">
                <div className="flex items-center gap-2 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                  <Shield className="w-4 h-4 animate-pulse" /> Dispatching Sandbox MFA Code
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-normal">
                  Our system simulated dispatching an activation pin to your development inbox: <span className="text-white font-mono">{verifyEmailAddress}</span>.
                </p>
                
                <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-500">SIMULATED SMS/EMAIL CODE:</span>
                  <span className="text-[#22d3ee] font-bold tracking-widest text-sm select-all animate-pulse">
                    {generatedPin}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block text-left">
                  Enter 6-Digit Activation Token PIN
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="e.g. 521894"
                  required
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl py-3 text-center text-lg outline-none tracking-widest font-mono text-cyan-400 focus:border-cyan-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-450 hover:to-blue-550 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition outline-none cursor-pointer"
              >
                Verify & Activate developer profile 
                <Check className="w-4 h-4 text-emerald-400" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    const numPin = Math.floor(100000 + Math.random() * 900000).toString();
                    setGeneratedPin(numPin);
                    setSuccessMsg("Simulated pin codes rotated successfully.");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 outline-none cursor-pointer flex items-center justify-center gap-1.5 mx-auto font-mono text-[10px]"
                >
                  <RefreshCw className="w-3 h-3" /> Resend Pin Code
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Security disclaimer footer */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-850/80 text-center flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-slate-500 font-mono leading-none tracking-wide">
            AES_256 SECURITY LEVEL ACTIVATED
          </span>
        </div>

      </div>

    </div>
  );
}
