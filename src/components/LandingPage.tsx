import React from "react";
import { motion } from "motion/react";
import { 
  Terminal, Sparkles, Code, Cpu, ChevronRight, Zap, Shield, HelpCircle, 
  Layers, Database, ArrowRight, Star, Globe, Eye, Palette, CheckCircle 
} from "lucide-react";
import { ActiveTab } from "../types";

interface LandingPageProps {
  onNavigate: (tab: ActiveTab) => void;
  onQuickLogin: () => void;
  userEmail: string | undefined;
}

const TOOL_SHOWCASE = [
  {
    title: "AI Core Text Sandbox",
    desc: "Interactive developer parameters control for temperature, Top-P, and system prompts utilizing state-of-the-art models.",
    icon: Code,
    tab: "text-gen" as const,
    color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
  },
  {
    title: "Document Summarizer",
    desc: "Ingest technical logs, articles, or blueprints with customizable presentation formats and targeted summary sizes.",
    icon: Layers,
    tab: "summarize" as const,
    color: "text-blue-400 border-blue-500/20 bg-blue-500/5",
  },
  {
    title: "Grammar Core Polisher",
    desc: "Analyze developer comments, readmes, and manuals. Explains grammatical corrections and audits readability index scores.",
    icon: Palette,
    tab: "grammar" as const,
    color: "text-pink-400 border-pink-500/20 bg-pink-500/5",
  },
  {
    title: "Code Explainer & Audit",
    desc: "High-contrast logic review. Conduct line-by-line step explanations, Big O runtime calculations, and code optimizations.",
    icon: Terminal,
    tab: "explainer" as const,
    color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  },
  {
    title: "PDF Q&A Research",
    desc: "Document retriever. Load custom manuals or academic logs in state to execute secure isolated context Q&A retrieval.",
    icon: Database,
    tab: "pdf-qa" as const,
    color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
  },
  {
    title: "Vector SVG Compiler",
    desc: "Code-level SVG illustration compiler. Design, view, zoom, and inspect raw vector color nodes and XML outputs.",
    icon: Sparkles,
    tab: "image-gen" as const,
    color: "text-purple-400 border-purple-500/20 bg-purple-500/5",
  },
];

const PRICING_PLANS = [
  {
    name: "Developer Sandbox",
    price: "$0",
    period: "forever",
    description: "Ideal for student research, testing playground parameters, and proxy calls.",
    features: [
      "100 AI compilations / daily",
      "Full access to all 6 sandbox engines",
      "Dynamic prompt templates & playground tabs",
      "Client browser local backup buffer",
      "Standard token limits up to 4k tokens",
    ],
    buttonText: "Launch Free Console",
    popular: false,
  },
  {
    name: "Pro Engineer SLA",
    price: "$49",
    period: "per month",
    description: "For engineers who require high-concurrency dev keys, analytics, and custom keys.",
    features: [
      "Unlimited requests & custom Gemini API keys",
      "Unique generated NeuralVoid bearer tokens",
      "Interactive analytics & raw usage auditing",
      "CSV history backup download tool",
      "Simulated Cloud Spanner sync node",
    ],
    buttonText: "Upgrade Dashboard",
    popular: true,
  },
  {
    name: "Enterprise Architecture",
    price: "Custom",
    period: "custom quota",
    description: "Premium enterprise SLA including multi-user team workspaces and team admin log audits.",
    features: [
      "Dedicated high-throughput API gateway nodes",
      "Custom system systemInstruction overlays",
      "Global analytics and team access control",
      "Advanced PDF vector database embedding layers",
      "Uptime SLA 99.99% Node support",
    ],
    buttonText: "Contact Sales",
    popular: false,
  },
];

export default function LandingPage({ onNavigate, onQuickLogin, userEmail }: LandingPageProps) {
  return (
    <div className="space-y-20 pb-16 animate-fade-in relative z-10">
      
      {/* 1. Hero Showcase Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-300 font-semibold tracking-wide uppercase"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>PORTFOLIO PLATFORM PROJECT DEMO</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight font-sans"
        >
          The Unified <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">AI Developer Toolkit</span> Platform
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-400 md:text-lg leading-relaxed max-w-2xl mx-auto"
        >
          A highly polished, multi-engine platform simulating OpenAI's developer portal. Access text generation, document token summaries, AST code explanations, and XML SVG vector compilers all from an inspectable, audited core.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center gap-4 pt-4 flex-wrap"
        >
          <button
            onClick={() => onNavigate("dashboard")}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-450 hover:to-blue-550 text-white font-mono text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/15 cursor-pointer outline-none transition"
          >
            Launch Playground Console <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onNavigate("api-docs")}
            className="px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-mono text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer outline-none transition"
          >
            Read API Docs <Code className="w-4 h-4" />
          </button>
        </motion.div>
      </section>

      {/* 2. Interactive Terminal Demo Showcase */}
      <section className="glass-panel border border-slate-800 rounded-2xl shadow-2xl p-1 bg-[#080d19] overflow-hidden max-w-4xl mx-auto">
        <div className="bg-[#030712] border-b border-slate-850 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 block" />
            <span className="text-[10px] font-mono text-slate-500 ml-3 uppercase select-none">neuralvoid-developer-core.js</span>
          </div>
          <span className="text-[9px] font-mono text-[#22d3ee] px-2 py-0.5 bg-cyan-950/40 border border-cyan-800/10 rounded">SLA GATEWAY LINK: LIVE</span>
        </div>
        <div className="p-5 font-mono text-xs text-left bg-slate-950 space-y-3.5 text-slate-300 max-h-[290px] overflow-auto select-all">
          <div className="text-slate-500">// Initialize standard portfolio sandbox client</div>
          <div><span className="text-pink-400">const</span> <span className="text-cyan-400">NeuralVoid</span> = <span className="text-blue-400">require</span>(<span className="text-amber-300">"@neuralvoid/developer-core"</span>);</div>
          <div><span className="text-pink-400">const</span> <span className="text-cyan-400">sdk</span> = <span className="text-pink-400">new</span> <span className="text-yellow-400">NeuralVoid</span>({`{ apiKey: `}<span className="text-emerald-400">"nv_live_8a2d3fec99de2bc"</span>{` }`});</div>
          <br />
          <div className="text-slate-500">// Call compiled Vector SVG Graphic compilation from layout instructions</div>
          <div>
            <span className="text-pink-400">const</span> {`{ svgCode, palette }`} = <span className="text-pink-400">await</span> <span className="text-cyan-400">sdk</span>.<span className="text-cyan-300">image</span>.<span className="text-cyan-300">compile</span>({`{`}
            <div className="pl-6">prompt: <span className="text-amber-300">"Sleek geometric badge emblem, neon blue flowlines"</span>,</div>
            <div className="pl-6">style: <span className="text-amber-300">"Minimal vector flat design"</span>,</div>
            <div className="pl-6">aspectRatio: <span className="text-amber-300">"1:1"</span></div>
            {`}`});
          </div>
          <br />
          <div>
            <span className="text-cyan-400">console</span>.<span className="text-cyan-300">log</span>(<span className="text-amber-300">`SVG layout created with colors: ${`palette`}`</span>);
            <span className="text-slate-500"> // Outputs raw XML + Palette hex metrics!</span>
          </div>
        </div>
      </section>

      {/* 3. Product Features & Tools Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-sm mx-auto">
          <h2 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-widest leading-none">6 Developer Sandbox Utilities</h2>
          <p className="text-lg font-bold text-white tracking-tight font-sans">Full Playground Support</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOL_SHOWCASE.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <motion.div
                whileHover={{ y: -4, borderColor: "#22d3ee" }}
                transition={{ duration: 0.15 }}
                key={idx}
                className="glass-panel border border-slate-800 p-5 rounded-2xl shadow-xl hover:shadow-cyan-500/5 transition duration-150 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${tool.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{tool.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{tool.desc}</p>
                </div>

                <button
                  onClick={() => onNavigate(tool.tab)}
                  className="w-full mt-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-[11px] font-mono font-bold text-slate-300 hover:text-white rounded-lg flex items-center justify-center gap-1 cursor-pointer transition"
                >
                  Configure Tool <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. Elegant Pricing Tiers - To showcase full SaaS capability */}
      <section className="space-y-8 bg-slate-950/20 py-10 rounded-2xl border border-slate-850/50 p-6">
        <div className="text-center space-y-2 max-w-md mx-auto">
          <h2 className="text-xs font-bold font-mono text-blue-400 uppercase tracking-widest leading-none">Aesthetic Transparent Quotas</h2>
          <p className="text-lg font-bold text-white tracking-tight font-sans">Developer Friendly Pricing Plans</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan, idx) => (
            <div 
              key={idx}
              className={`glass-panel border rounded-2xl shadow-xl p-5 flex flex-col justify-between relative ${
                plan.popular 
                  ? "border-cyan-500 bg-cyan-950/5 shadow-cyan-500/5 md:-translate-y-2" 
                  : "border-slate-800 bg-slate-950/30"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 text-[9px] font-bold font-mono text-black rounded-full uppercase tracking-wider leading-none">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono tracking-wide">{plan.name}</h3>
                  <p className="text-[11px] text-slate-400 font-sans mt-1.5 leading-relaxed">{plan.description}</p>
                </div>

                <div className="py-2 flex items-baseline gap-1.5 border-y border-slate-850">
                  <span className="text-2xl md:text-3xl font-extrabold text-white font-mono">{plan.price}</span>
                  <span className="text-[10px] text-slate-500 font-mono">/ {plan.period}</span>
                </div>

                <ul className="space-y-2.5">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex gap-2 items-start text-[11px] text-slate-400 font-sans">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  if (plan.name.includes("Pro")) {
                    onNavigate("settings");
                  } else {
                    onNavigate("dashboard");
                  }
                }}
                className={`w-full mt-6 py-2.5 rounded-xl font-mono text-xs font-bold transition select-none cursor-pointer border ${
                  plan.popular
                    ? "bg-cyan-600 hover:bg-cyan-500 text-white border-transparent"
                    : "bg-slate-950 hover:bg-slate-900 text-slate-350 border-slate-800 hover:border-slate-755"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Developer Testimonials & Trust */}
      <section className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-widest leading-none font-bold">DEVELOPER FEEDBACK RECORD</h2>
          <p className="text-lg font-bold text-white tracking-tight font-sans">Used by portfolio reviewers & engineers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              &quot;The interactive SVG compiler works flawlessly. Being able to inspect the color palette and copy beautiful scalable vector schemas in the playground is incredibly smart, especially for frontend portfolios.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono flex items-center justify-center font-bold text-cyan-300">
                JD
              </div>
              <div>
                <span className="text-[10px] text-white font-mono font-bold block leading-none">Jameson Dev</span>
                <span className="text-[8px] text-slate-500 font-mono block mt-1 uppercase leading-none">Principal Engineer, WebSledge</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              &quot;Most projects stop at mock APIs, but this is a real full-stack node gateway. The PDF research isolation using strict context works perfectly during engineering walkthrough discussions.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-mono flex items-center justify-center font-bold text-purple-300">
                SC
              </div>
              <div>
                <span className="text-[10px] text-white font-mono font-bold block leading-none">Sarah Chen</span>
                <span className="text-[8px] text-slate-500 font-mono block mt-1 uppercase leading-none">Lead Recruiter, StackSpace</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Hero CTA Footer onboarding */}
      <section className="text-center p-8 md:p-12 background-gradient glass-panel border border-slate-800 rounded-3xl max-w-4xl mx-auto space-y-5 bg-gradient-to-tr from-slate-950 to-cyan-950/20">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">Ready to audit the AI Developer Gateway?</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Switch dev profiles, custom configure API credentials keys, create custom authorization secrets, and inspect real concurrency telemetry logs instantly.
        </p>
        <div className="pt-2">
          {userEmail ? (
            <button
              onClick={() => onNavigate("dashboard")}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-mono font-bold text-xs select-none cursor-pointer outline-none transition inline-flex items-center gap-2 shadow-md shadow-cyan-500/10"
            >
              Enter Dashboard Console <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onQuickLogin}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-450 hover:to-blue-550 rounded-xl text-white font-mono font-bold text-xs select-none cursor-pointer outline-none transition inline-flex items-center gap-2 shadow-md shadow-cyan-500/10"
            >
              Sign In Dev Profile <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>

    </div>
  );
}
