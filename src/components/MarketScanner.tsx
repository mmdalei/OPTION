import React, { useState } from 'react';
import { formatNumber, formatRials } from '../utils/blackScholes';
import { OptionContract } from '../types/options';
import { Zap, TrendingUp, TrendingDown, Target, Percent, Search } from 'lucide-react';

interface MarketScannerProps {
  onAddToStrategy: (contract: OptionContract, action: 'buy' | 'sell') => void;
}

export const MarketScanner: React.FC<MarketScannerProps> = ({ onAddToStrategy }) => {
  const [scannerType, setScannerType] = useState<'volume' | 'oi_surge' | 'arbitrage' | 'high_iv'>('volume');

  // داده‌های نمادهای منتخب برای اسکنر
  const topVolumeContracts = [
    { symbol: 'ضاهرم۱۰۱۴', underlying: 'اهرم', type: 'call', strike: 21000, last: 1350, change: 14.2, volume: 14850000, oi: 84200, value: 2004.7 },
    { symbol: 'ضخود۱۲۱۰', underlying: 'خودرو', type: 'call', strike: 2800, last: 185, change: -4.5, volume: 9240000, oi: 61800, value: 170.9 },
    { symbol: 'طاهرم۱۰۱۴', underlying: 'اهرم', type: 'put', strike: 21000, last: 420, change: -18.4, volume: 8120000, oi: 42300, value: 341.0 },
    { symbol: 'ضطلا۰۶۱۵', underlying: 'طلا', type: 'call', strike: 27000, last: 1420, change: 8.6, volume: 6450000, oi: 38900, value: 915.9 },
    { symbol: 'ضفمل۸۰۱۶', underlying: 'فملی', type: 'call', strike: 6800, last: 480, change: 3.2, volume: 4890000, oi: 29500, value: 234.7 },
    { symbol: 'طخود۱۲۱۰', underlying: 'خودرو', type: 'put', strike: 2800, last: 195, change: 8.3, volume: 4120000, oi: 33400, value: 80.3 },
  ];

  const oiSurgeContracts = [
    { symbol: 'ضاهرم۱۰۱۶', underlying: 'اهرم', strike: 22000, oiChange: '+۸,۴۰۰ (+۲۸٪)', oiTotal: 38400, last: 980, type: 'call', flowType: 'ورود پول صعودی سنگین' },
    { symbol: 'طخود۱۲۰۵', underlying: 'خودرو', strike: 2600, oiChange: '+۴,۹۰۰ (+۳۵٪)', oiTotal: 18900, last: 110, type: 'put', flowType: 'هج ریسک ریزش خودرو' },
    { symbol: 'ضطلا۰۶۲۰', underlying: 'طلا', strike: 28000, oiChange: '+۳,۲۰۰ (+۱۹٪)', oiTotal: 20100, last: 950, type: 'call', flowType: 'تقاضای سفته‌بازی صعود طلا' },
    { symbol: 'ضشست۰۹۱۰', underlying: 'شستا', strike: 1200, oiChange: '+۲,۸۵۰ (+۲۲٪)', oiTotal: 15800, last: 88, type: 'call', flowType: 'جمع‌آوری موقعیت در کف' },
  ];

  const arbitrageOpportunities = [
    {
      underlying: 'اهرم',
      strike: 21000,
      callSymbol: 'ضاهرم۱۰۱۴',
      putSymbol: 'طاهرم۱۰۱۴',
      callPrice: 1350,
      putPrice: 420,
      spotPrice: 21450,
      parityDiff: '+۲.۸٪',
      strategy: 'تبدیل معکوس (Reverse Conversion)',
      profitPotential: '۲۸۰,۰۰۰ ریال به ازای هر دسته قرارداد بدون ریسک جهت بازار',
    },
    {
      underlying: 'طلا',
      strike: 27000,
      callSymbol: 'ضطلا۰۶۱۵',
      putSymbol: 'ططلا۰۶۱۵',
      callPrice: 1420,
      putPrice: 680,
      spotPrice: 27200,
      parityDiff: '+۱.۹٪',
      strategy: 'آربیتراژ برابری Put-Call',
      profitPotential: '۱۹۰,۰۰۰ ریال به ازای هر قرارداد با نرخ بازده بالاتر از اخزا',
    },
    {
      underlying: 'خودرو',
      strike: 2800,
      callSymbol: 'ضخود۱۲۱۰',
      putSymbol: 'طخود۱۲۱۰',
      callPrice: 185,
      putPrice: 195,
      spotPrice: 2780,
      parityDiff: '-۱.۲٪',
      strategy: 'فرصت اسپرد مصنوعی (Synthetic Long)',
      profitPotential: 'تامین مالی ارزان‌تر از نرخ سود بانکی',
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header & Market Sentiment Gauge */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              دیده‌بان تحلیلی و اسکنر هوشمند بورس تهران
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              رصد معاملات غیرعادی، ورود پول هوشمند به موقعیت‌های باز (Open Interest) و فرصت‌های آربیتراژ برابری Call-Put
            </p>
          </div>

          {/* Sentiment Meter */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">نسبت کلی P/C بازار:</span>
              <span className="text-base font-bold text-emerald-400 font-mono">۰.۶۸</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[11px]">احساسات غالب بازار:</span>
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                صعودی (Bullish)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scanner View Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setScannerType('volume')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
            scannerType === 'volume'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          بیشترین حجم و ارزش معاملات
        </button>
        <button
          onClick={() => setScannerType('oi_surge')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
            scannerType === 'oi_surge'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          جهش موقعیت‌های باز (ورود پول)
        </button>
        <button
          onClick={() => setScannerType('arbitrage')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
            scannerType === 'arbitrage'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          فرصت‌های آربیتراژ (Put-Call Parity)
        </button>
      </div>

      {/* 3. Dynamic Scanner View */}
      {scannerType === 'volume' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-semibold text-white">فعال‌ترین قراردادهای آپشن از نظر نقدشوندگی:</span>
            <span className="text-slate-400">به‌روزرسانی با هر تیک معاملاتی</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">نماد</th>
                  <th className="py-2.5 px-3">سهم پایه</th>
                  <th className="py-2.5 px-3">نوع قرارداد</th>
                  <th className="py-2.5 px-3">قیمت اعمال</th>
                  <th className="py-2.5 px-3">قیمت آخرین</th>
                  <th className="py-2.5 px-3">تغییر روز</th>
                  <th className="py-2.5 px-3">حجم معاملات</th>
                  <th className="py-2.5 px-3">موقعیت‌های باز</th>
                  <th className="py-2.5 px-3">ارزش (م.ر)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-mono">
                {topVolumeContracts.map((c) => (
                  <tr key={c.symbol} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-white">{c.symbol}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">{c.underlying}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.type === 'call'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {c.type === 'call' ? 'اختیار خرید' : 'اختیار فروش'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">{formatRials(c.strike)}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{formatRials(c.last)}</td>
                    <td className={`py-2.5 px-3 font-semibold ${c.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {c.change > 0 ? '+' : ''}{c.change}٪
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{formatNumber(c.volume)}</td>
                    <td className="py-2.5 px-3 text-slate-400">{formatNumber(c.oi)}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-semibold">{formatNumber(c.value, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {scannerType === 'oi_surge' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-semibold text-white">قراردادهای با بیشترین رشد موقعیت باز (ردپای پول هوشمند):</span>
            <span className="text-amber-300">نشان‌دهنده تجمع سفارشات سنگین بازیگران بزرگ</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">نماد</th>
                  <th className="py-2.5 px-3">سهم پایه</th>
                  <th className="py-2.5 px-3">نوع قرارداد</th>
                  <th className="py-2.5 px-3">قیمت اعمال</th>
                  <th className="py-2.5 px-3">رشد موقعیت باز</th>
                  <th className="py-2.5 px-3">مجموع OI</th>
                  <th className="py-2.5 px-3">تحلیل جریان پول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {oiSurgeContracts.map((c) => (
                  <tr key={c.symbol} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{c.symbol}</td>
                    <td className="py-2.5 px-3 text-slate-300">{c.underlying}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.type === 'call'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {c.type === 'call' ? 'اختیار خرید' : 'اختیار فروش'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-200">{formatRials(c.strike)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{c.oiChange}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{formatNumber(c.oiTotal)}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-medium">{c.flowType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {scannerType === 'arbitrage' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs text-slate-300">
            <strong className="text-amber-300 block mb-1">فرمول برابری اختیار خرید و فروش (Put-Call Parity):</strong>
            طبق اصل عدم آربیتراژ، باید رابطه <code className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded">C - P = S - K · e^(-rT)</code> همواره برقرار باشد. انحراف قیمت کال و پوت در بورس تهران فرصت‌های سوددهی بدون ریسک جهت بازار فراهم می‌کند.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {arbitrageOpportunities.map((arb, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{arb.underlying} - اعمال {formatRials(arb.strike)}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                    انحراف {arb.parityDiff}
                  </span>
                </div>

                <div className="text-xs space-y-1 font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>کال ({arb.callSymbol}):</span>
                    <span className="text-white">{formatRials(arb.callPrice)} ریال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>پوت ({arb.putSymbol}):</span>
                    <span className="text-white">{formatRials(arb.putPrice)} ریال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>قیمت نقدی سهم:</span>
                    <span className="text-cyan-300">{formatRials(arb.spotPrice)} ریال</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-0.5">استراتژی اجرایی:</span>
                  <span className="font-semibold text-emerald-300 block mb-1">{arb.strategy}</span>
                  <p className="text-[11px] text-slate-400">{arb.profitPotential}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
