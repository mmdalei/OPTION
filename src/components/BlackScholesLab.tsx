import React, { useState, useMemo } from 'react';
import {
  blackScholesPrice,
  calculateOptionGreeks,
  getMoneyness,
  formatRials,
  formatToman,
} from '../utils/blackScholes';
import { Calculator, HelpCircle, ArrowRight, Gauge, Activity } from 'lucide-react';

export const BlackScholesLab: React.FC = () => {
  // ورودی‌های متغیر بلک-شولز
  const [spotPrice, setSpotPrice] = useState<number>(22000);
  const [strikePrice, setStrikePrice] = useState<number>(22000);
  const [daysToExpiry, setDaysToExpiry] = useState<number>(45);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.30); // ۳۰٪ نرخ گواهی سپرده / اخزا
  const [volatility, setVolatility] = useState<number>(0.38); // ۳۸٪ نوسان تاریخی

  const T = Math.max(1, daysToExpiry) / 365.0;

  // محاسبات بلک-شولز برای Call و Put
  const callGreeks = useMemo(() => {
    return calculateOptionGreeks(spotPrice, strikePrice, T, riskFreeRate, volatility, 'call');
  }, [spotPrice, strikePrice, T, riskFreeRate, volatility]);

  const putGreeks = useMemo(() => {
    return calculateOptionGreeks(spotPrice, strikePrice, T, riskFreeRate, volatility, 'put');
  }, [spotPrice, strikePrice, T, riskFreeRate, volatility]);

  const callIntrinsic = Math.max(0, spotPrice - strikePrice);
  const callTimeValue = Math.max(0, callGreeks.theoreticalPrice - callIntrinsic);

  const putIntrinsic = Math.max(0, strikePrice - spotPrice);
  const putTimeValue = Math.max(0, putGreeks.theoreticalPrice - putIntrinsic);

  const callMoneyness = getMoneyness(spotPrice, strikePrice, 'call');
  const putMoneyness = getMoneyness(spotPrice, strikePrice, 'put');

  const callLeverage =
    callGreeks.theoreticalPrice > 0
      ? ((callGreeks.delta * spotPrice) / callGreeks.theoreticalPrice).toFixed(1)
      : '۰';

  const putLeverage =
    putGreeks.theoreticalPrice > 0
      ? ((Math.abs(putGreeks.delta) * spotPrice) / putGreeks.theoreticalPrice).toFixed(1)
      : '۰';

  // تولید نقاط منحنی قیمت بر حسب قیمت سهم پایه
  const curvePoints = useMemo(() => {
    const minS = Math.round(strikePrice * 0.7);
    const maxS = Math.round(strikePrice * 1.3);
    const steps = 40;
    const stepSize = (maxS - minS) / steps;

    const points: { s: number; call: number; put: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const sVal = minS + i * stepSize;
      const c = blackScholesPrice(sVal, strikePrice, T, riskFreeRate, volatility, 'call');
      const p = blackScholesPrice(sVal, strikePrice, T, riskFreeRate, volatility, 'put');
      points.push({ s: sVal, call: c, put: p });
    }
    return points;
  }, [strikePrice, T, riskFreeRate, volatility]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header description */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              آزمایشگاه محاسبات بلک-شولز و شبیه‌ساز یونانی‌ها (Option Greeks Lab)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              آزمایش حساسیت قیمت اختیار معامله به متغیرهای پنج‌گانه بازار: قیمت دارایی پایه، قیمت اعمال، زمان، نرخ بهره و نوسان‌پذیری
            </p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Inputs & Sliders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-400" />
          تنظیم متغیرهای ورودی مدل بلک-شولز
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Spot Price (S) */}
          <div className="space-y-1.5 bg-slate-950/80 p-3.5 rounded-lg border border-slate-850">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">قیمت سهم پایه (S):</span>
              <span className="font-mono text-emerald-400 font-bold">
                {formatRials(spotPrice)} ریال
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="500"
              value={spotPrice}
              onChange={(e) => setSpotPrice(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>۱,۰۰۰</span>
              <span>۵۰,۰۰۰</span>
              <span>۱۰۰,۰۰۰</span>
            </div>
          </div>

          {/* Strike Price (K) */}
          <div className="space-y-1.5 bg-slate-950/80 p-3.5 rounded-lg border border-slate-850">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">قیمت اعمال قرارداد (K):</span>
              <span className="font-mono text-cyan-300 font-bold">
                {formatRials(strikePrice)} ریال
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="500"
              value={strikePrice}
              onChange={(e) => setStrikePrice(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>۱,۰۰۰</span>
              <span>۵۰,۰۰۰</span>
              <span>۱۰۰,۰۰۰</span>
            </div>
          </div>

          {/* Days to Expiry (T) */}
          <div className="space-y-1.5 bg-slate-950/80 p-3.5 rounded-lg border border-slate-850">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">زمان تا سررسید (DTE):</span>
              <span className="font-mono text-amber-300 font-bold">
                {daysToExpiry} روز ({T.toFixed(2)} سال)
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="365"
              step="1"
              value={daysToExpiry}
              onChange={(e) => setDaysToExpiry(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>۱ روز</span>
              <span>۱۸۰ روز</span>
              <span>۳۶۵ روز</span>
            </div>
          </div>

          {/* Volatility (Sigma) */}
          <div className="space-y-1.5 bg-slate-950/80 p-3.5 rounded-lg border border-slate-850">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">نوسان‌پذیری سالانه (σ):</span>
              <span className="font-mono text-purple-300 font-bold">
                {(volatility * 100).toFixed(0)}٪
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.50"
              step="0.01"
              value={volatility}
              onChange={(e) => setVolatility(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>۵٪</span>
              <span>۵۰٪</span>
              <span>۱۵۰٪</span>
            </div>
          </div>

          {/* Risk-free Interest Rate (r) */}
          <div className="space-y-1.5 bg-slate-950/80 p-3.5 rounded-lg border border-slate-850">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">نرخ بدون ریسک (r):</span>
              <span className="font-mono text-white font-bold">
                {(riskFreeRate * 100).toFixed(1)}٪ (اخزا)
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.45"
              step="0.005"
              value={riskFreeRate}
              onChange={(e) => setRiskFreeRate(Number(e.target.value))}
              className="w-full accent-slate-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>۱۰٪</span>
              <span>۳۰٪</span>
              <span>۴۵٪</span>
            </div>
          </div>

          {/* Preset Buttons for Instant Testing */}
          <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-850 flex flex-col justify-center gap-2 text-xs">
            <span className="text-slate-400">حالت‌های متداول:</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSpotPrice(22000);
                  setStrikePrice(22000);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer flex-1"
              >
                سر‌به‌سر (ATM)
              </button>
              <button
                onClick={() => {
                  setSpotPrice(24000);
                  setStrikePrice(20000);
                }}
                className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs cursor-pointer flex-1"
              >
                کال در سود (ITM)
              </button>
              <button
                onClick={() => {
                  setSpotPrice(19000);
                  setStrikePrice(22000);
                }}
                className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs cursor-pointer flex-1"
              >
                پوت در سود (ITM)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Valuation Results: Call vs Put Theoretical Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Call Option Card */}
        <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="font-bold text-white text-base">
                ارزش‌گذاری اختیار خرید (Call Option)
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                callMoneyness === 'ITM'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : callMoneyness === 'ATM'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {callMoneyness === 'ITM' ? 'در سود (ITM)' : callMoneyness === 'ATM' ? 'سر‌به‌سر (ATM)' : 'در زیان (OTM)'}
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">قیمت تئوریک بلک-شولز (پرمیوم منصفانه):</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {formatRials(callGreeks.theoreticalPrice)} <span className="text-xs font-normal text-slate-400">ریال</span>
              </span>
            </div>
            <div className="text-left font-mono text-xs text-slate-400">
              اهرم موثر: <strong className="text-white text-sm">{callLeverage}</strong> برابر
            </div>
          </div>

          {/* Intrinsic vs Time Value Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">ارزش ذاتی (Intrinsic Value):</span>
              <span className="font-mono text-slate-200 font-semibold">{formatRials(callIntrinsic)} ریال</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{
                  width: `${callGreeks.theoreticalPrice > 0 ? (callIntrinsic / callGreeks.theoreticalPrice) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-amber-500 h-full"
                style={{
                  width: `${callGreeks.theoreticalPrice > 0 ? (callTimeValue / callGreeks.theoreticalPrice) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ارزش زمانی (Time Value):</span>
              <span className="font-mono text-amber-300 font-semibold">{formatRials(callTimeValue)} ریال</span>
            </div>
          </div>

          {/* Greeks Grid */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs pt-2">
            <div className="bg-slate-950 p-2 rounded border border-slate-850">
              <span className="text-[11px] text-slate-400 block">دلتا (Δ)</span>
              <span className="font-mono font-bold text-white text-sm">{callGreeks.delta}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-850">
              <span className="text-[11px] text-slate-400 block">گاما (Γ)</span>
              <span className="font-mono font-bold text-white text-sm">{callGreeks.gamma}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-850">
              <span className="text-[11px] text-slate-400 block">تتا (Θ)</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{callGreeks.theta}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-850">
              <span className="text-[11px] text-slate-400 block">وگا (V)</span>
              <span className="font-mono font-bold text-purple-300 text-sm">{callGreeks.vega}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-850">
              <span className="text-[11px] text-slate-400 block">رو (ρ)</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">{callGreeks.rho}</span>
            </div>
          </div>
        </div>

        {/* Put Option Card */}
        <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <h3 className="font-bold text-white text-base">
                ارزش‌گذاری اختیار فروش (Put Option)
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                putMoneyness === 'ITM'
                  ? 'bg-rose-500/20 text-rose-400'
                  : putMoneyness === 'ATM'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {putMoneyness === 'ITM' ? 'در سود (ITM)' : putMoneyness === 'ATM' ? 'سر‌به‌سر (ATM)' : 'در زیان (OTM)'}
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">قیمت تئوریک بلک-شولز (پرمیوم منصفانه):</span>
              <span className="text-2xl font-bold font-mono text-rose-400">
                {formatRials(putGreeks.theoreticalPrice)} <span className="text-xs font-normal text-slate-400">ریال</span>
              </span>
            </div>
            <div className="text-left font-mono text-xs text-slate-400">
              اهرم موثر: <strong className="text-white text-sm">{putLeverage}</strong> برابر
            </div>
          </div>

          {/* Intrinsic vs Time Value Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">ارزش ذاتی (Intrinsic Value):</span>
              <span className="font-mono text-slate-200 font-semibold">{formatRials(putIntrinsic)} ریال</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-rose-500 h-full"
                style={{
                  width: `${putGreeks.theoreticalPrice > 0 ? (putIntrinsic / putGreeks.theoreticalPrice) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-amber-500 h-full"
                style={{
                  width: `${putGreeks.theoreticalPrice > 0 ? (putTimeValue / putGreeks.theoreticalPrice) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ارزش زمانی (Time Value):</span>
              <span className="font-mono text-amber-300 font-semibold">{formatRials(putTimeValue)} ریال</span>
            </div>
          </div>

          {/* Greeks Grid */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs pt-2">
            <div className="bg-slate-950 p-2 rounded border border-slate-850">
              <span className="text-[11px] text-slate-400 block">دلتا (Δ)</span>
              <span className="font-mono font-bold text-white text-sm">{putGreeks.delta}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-850">
              <span className="text-[11px] text-slate-400 block">گاما (Γ)</span>
              <span className="font-mono font-bold text-white text-sm">{putGreeks.gamma}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-850">
              <span className="text-[11px] text-slate-400 block">تتا (Θ)</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{putGreeks.theta}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-850">
              <span className="text-[11px] text-slate-400 block">وگا (V)</span>
              <span className="font-mono font-bold text-purple-300 text-sm">{putGreeks.vega}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-850">
              <span className="text-[11px] text-slate-400 block">رو (ρ)</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">{putGreeks.rho}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Practical Greeks Guide for Iranian Market Traders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          راهنمای کاربردی یونانی‌های آپشن در معاملات بورس تهران
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-300">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <strong className="text-emerald-400 block mb-1">دلتا (Delta):</strong>
            نشان می‌دهد اگر سهم پایه ۱ ریال رشد کند، پرمیوم اختیار چند ریال رشد می‌کند. برای کال بین ۰ تا ۱ و برای پوت بین ۰ تا ۱- است.
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <strong className="text-amber-400 block mb-1">تتا (Theta - زوال زمان):</strong>
            دشمن خریدار آپشن و دوست فروشنده آن! نشان می‌دهد گذشت هر ۲۴ ساعت، چه مقدار از ارزش پرمیوم قرارداد را بدون تغییر قیمت سهم می‌سوزاند.
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <strong className="text-purple-400 block mb-1">وگا (Vega):</strong>
            حساسیت قیمت آپشن به افزایش یا کاهش نوسان بازار (IV). قبل از گزارش‌های کدال یا اخبار مهم، وگا به نفع خریداران عمل می‌کند.
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <strong className="text-cyan-400 block mb-1">گاما (Gamma):</strong>
            شتاب تغییرات دلتا. قراردادهای نزدیک به سر‌به‌سر (ATM) در روزهای پایانی سررسید بالاترین گاما را دارند که نوسانات انفجاری ایجاد می‌کند.
          </div>
        </div>
      </div>
    </div>
  );
};
