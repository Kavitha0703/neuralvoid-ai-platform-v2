import React, { useState, useEffect } from "react";
import { CreditCard, Zap, TrendingUp, Calendar, AlertCircle, ArrowUpCircle, CheckCircle, Bell } from "lucide-react";

interface BillingSettingsProps {
  onUpgradeClick?: () => void;
}

export default function BillingSettings({ onUpgradeClick }: BillingSettingsProps) {
  const [usage, setUsage] = useState(85);
  const [limit, setLimit] = useState(100);
  const [renewalDate, setRenewalDate] = useState("2026-07-01");
  const [plan, setPlan] = useState("Pro Tier");
  const [notificationSent, setNotificationSent] = useState(false);

  // Trigger UI notification when usage reaches 90%
  useEffect(() => {
    if (usage >= limit * 0.9 && !notificationSent) {
      setNotificationSent(true);
    }
  }, [usage, limit, notificationSent]);

  const percentage = Math.min(100, Math.max(0, (usage / limit) * 100));

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4 border border-slate-800">
      <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-3">
        <CreditCard className="w-4 h-4 text-pink-400" /> BILLING & SUBSCRIPTION
      </h2>

      {notificationSent && (
        <div className="bg-amber-950/30 text-amber-400 text-xs p-3 rounded-xl border border-amber-900/50 flex gap-2 items-center">
          <Bell className="w-4.5 h-4.5 text-amber-400 shrink-0" />
          Alert: You have reached {Math.round(percentage)}% of your plan limit!
        </div>
      )}

      <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-850 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500 font-bold mb-1">Current Plan</div>
            <div className="font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> {plan}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-slate-500 font-bold mb-1">Renewal Date</div>
            <div className="font-mono text-slate-300 flex items-center gap-1.5 justify-end">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {renewalDate}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex justify-between items-end mb-2">
            <div className="text-[10px] font-mono tracking-wider uppercase text-slate-500 font-bold">API Requests Usage</div>
            <div className="font-mono text-xs">
              <span className="text-white font-bold">{usage}</span>
              <span className="text-slate-500"> / {limit}k</span>
            </div>
          </div>
          
          <div className="w-full bg-slate-900 rounded-full h-2.5 mb-1 relative overflow-hidden">
            <div 
              className={`h-2.5 rounded-full absolute left-0 top-0 transition-all duration-500 ${percentage >= 90 ? 'bg-rose-500' : percentage >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 text-right font-mono mt-1">
            {percentage.toFixed(1)}% of allowance used
          </p>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={() => {
            if (onUpgradeClick) onUpgradeClick();
            setUsage(Math.min(limit, usage + 5)); // Simulate usage increase for demo
          }}
          className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-sans text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-md shadow-pink-500/10 outline-none"
        >
          <ArrowUpCircle className="w-4 h-4" /> Upgrade to Enterprise Container
        </button>
      </div>
    </div>
  );
}
