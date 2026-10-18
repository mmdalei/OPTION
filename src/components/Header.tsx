import React from 'react';
import { Activity, Play, Pause, TrendingUp, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'chain' | 'payoff' | 'scanner' | 'lab' | 'backend';
  setActiveTab: (tab: 'chain' | 'payoff' | 'scanner' | 'lab' | 'backend') => void;
  isSimulating: boolean;
  setIsSimulating: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isSimulating,
  setIsSimulating,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      {/* Strict 3-zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl">
            ⌥
          </div>
          <button 
            onClick={() => setActiveTab('chain')}
            className="text-right focus:outline-none"
          >
            <span className="text-lg font-bold tracking-tight text-white block">
              OptionBaaz TSE
            </span>
            <span className="text-xs text-slate-400 block -mt-0.5">
              دیده‌بان اختیار معامله بورس تهران
            </span>
          </button>
        </div>

        {/* Zone 2: Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('chain')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer pb-0.5 ${
              activeTab === 'chain'
                ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                : 'hover:text-white'
            }`}
          >
            زنجیره قراردادها
          </button>
          <button
            onClick={() => setActiveTab('payoff')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer pb-0.5 ${
              activeTab === 'payoff'
                ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                : 'hover:text-white'
            }`}
          >
            ماشین‌حساب سود و زیان
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer pb-0.5 ${
              activeTab === 'scanner'
                ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                : 'hover:text-white'
            }`}
          >
            اسکنر و آربیتراژ
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer pb-0.5 ${
              activeTab === 'lab'
                ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                : 'hover:text-white'
            }`}
          >
            آزمایشگاه بلک-شولز
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer pb-0.5 ${
              activeTab === 'backend'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            کدهای پایتون و FastAPI
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsSimulating((prev) => !prev)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              isSimulating
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
            title="شبیه‌سازی جریان زنده مظنه‌ها و نوسان لحظه‌ای قیمت‌ها در بازار"
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>تیک زنده (فعال)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>شبیه‌ساز معاملات</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unboxed Market Status Strip */}
      <div className="bg-slate-900/60 border-t border-slate-800/60 text-xs text-slate-400 py-1 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-y-1">
          <div className="flex items-center gap-3">
            <span className="text-slate-300 font-medium">بازار بورس اوراق بهادار تهران</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>ساعت کاری: ۰۹:۰۰ الی ۱۲:۳۰ و ۱۵:۰۰</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-emerald-400 font-mono">شاخص کل: ۲,۱۴۵,۸۹۰ (+۱.۲٪)</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">نرخ بدون ریسک (اخزا):</span>
              <span className="text-amber-300 font-mono font-semibold">۳۱.۲٪</span>
            </div>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">نسبت P/C کل:</span>
              <span className="text-emerald-300 font-mono font-semibold">۰.۶۸ (جو صعودی)</span>
            </div>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">ارزش کل آپشن:</span>
              <span className="text-cyan-300 font-mono font-semibold">۳,۵۴۰ میلیارد ریال</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
