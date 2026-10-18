import React from 'react';
import { OptionContract } from '../types/options';
import { formatNumber, formatRials, formatToman } from '../utils/blackScholes';
import { X, Plus, TrendingUp, TrendingDown, Clock, Shield, BarChart3 } from 'lucide-react';

interface ContractDetailModalProps {
  contract: OptionContract | null;
  underlyingPrice: number;
  onClose: () => void;
  onAddToStrategy: (contract: OptionContract, action: 'buy' | 'sell') => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  contract,
  underlyingPrice,
  onClose,
  onAddToStrategy,
}) => {
  if (!contract) return null;

  const isCall = contract.type === 'call';
  const priceDiffWithTheoretical = contract.lastPrice - contract.theoreticalPrice;
  const valuationStatus =
    priceDiffWithTheoretical > 5
      ? 'حباب مثبت (گران‌تر از قیمت منصفانه)'
      : priceDiffWithTheoretical < -5
      ? 'حباب منفی (ارزان‌تر از قیمت منصفانه / فرصت خرید)'
      : 'منطبق بر قیمت منصفانه تئوریک';

  const maxBookVol = Math.max(
    ...contract.orderBook.map((b) => Math.max(b.bidVolume, b.askVolume)),
    100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto text-slate-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-0.5 text-xs font-bold rounded ${
                isCall
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isCall ? 'اختیار خرید (Call)' : 'اختیار فروش (Put)'}
            </span>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {contract.symbol}
            </h2>
            <span className="text-xs text-slate-400">
              نماد پایه: {contract.underlyingSymbol}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-lg border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">قیمت آخرین معامله</span>
              <span className="text-lg font-bold text-white font-mono">
                {formatRials(contract.lastPrice)} <span className="text-xs font-normal text-slate-400">ریال</span>
              </span>
              <span className="text-xs block text-slate-400 font-mono">
                ({formatToman(contract.lastPrice)} تومان)
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-0.5">قیمت اعمال (Strike)</span>
              <span className="text-lg font-bold text-cyan-300 font-mono">
                {formatRials(contract.strikePrice)}
              </span>
              <span className="text-xs block text-slate-400">
                {contract.moneyness === 'ITM' ? 'در سود (ITM)' : contract.moneyness === 'ATM' ? 'سر‌به‌سر (ATM)' : 'در زیان (OTM)'}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-0.5">سررسید و DTE</span>
              <span className="text-sm font-bold text-white">
                {contract.expirationDate}
              </span>
              <span className="text-xs block text-amber-300 font-mono">
                {contract.daysToExpiration} روز مانده
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-0.5">نقطه سر‌به‌سر</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {formatRials(contract.breakEvenPrice)}
              </span>
              <span className="text-xs block text-slate-400 font-mono">
                اهرم: {contract.effectiveLeverage} برابر
              </span>
            </div>
          </div>

          {/* Pricing Evaluation & Intrinsic vs Extrinsic */}
          <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">ارزیابی ارزش‌گذاری بلک-شولز:</span>
              <span className={priceDiffWithTheoretical > 5 ? 'text-rose-400' : 'text-emerald-400'}>
                {valuationStatus}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block mb-1">قیمت منصفانه تئوریک (BS)</span>
                <span className="font-mono text-sm font-semibold text-white">
                  {formatRials(contract.theoreticalPrice)} ریال
                </span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block mb-1">ارزش ذاتی (Intrinsic)</span>
                <span className="font-mono text-sm font-semibold text-emerald-400">
                  {formatRials(contract.intrinsicValue)} ریال
                </span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block mb-1">ارزش زمانی (Time Value)</span>
                <span className="font-mono text-sm font-semibold text-amber-400">
                  {formatRials(contract.timeValue)} ریال
                </span>
              </div>
            </div>
          </div>

          {/* Order Book (عمق ۵ مظنه) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-200">
                عمق بازار و ۵ مظنه برتر عرضه و تقاضا
              </h3>
              <span className="text-xs text-slate-400">
                حجم کل معاملات: {formatNumber(contract.volume)} قرارداد
              </span>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
              <div className="grid grid-cols-6 text-xs text-slate-400 bg-slate-900/80 py-1.5 px-3 border-b border-slate-800 text-center font-medium">
                <span className="col-span-1">تعداد تقاضا</span>
                <span className="col-span-1">قیمت تقاضا</span>
                <span className="col-span-2">دفتر سفارش</span>
                <span className="col-span-1">قیمت عرضه</span>
                <span className="col-span-1">تعداد عرضه</span>
              </div>

              <div className="divide-y divide-slate-850">
                {contract.orderBook.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-6 items-center py-1.5 px-3 text-xs text-center font-mono">
                    <span className="col-span-1 text-emerald-400 font-semibold">{row.bidVolume}</span>
                    <span className="col-span-1 text-emerald-300">{formatRials(row.bidPrice)}</span>
                    
                    {/* Visual Depth Bar */}
                    <div className="col-span-2 flex items-center h-2.5 px-1 gap-1">
                      <div 
                        className="bg-emerald-500/40 h-full rounded-r transition-all" 
                        style={{ width: `${(row.bidVolume / maxBookVol) * 50}%` }}
                      />
                      <div 
                        className="bg-rose-500/40 h-full rounded-l transition-all" 
                        style={{ width: `${(row.askVolume / maxBookVol) * 50}%` }}
                      />
                    </div>

                    <span className="col-span-1 text-rose-300">{formatRials(row.askPrice)}</span>
                    <span className="col-span-1 text-rose-400 font-semibold">{row.askVolume}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Greeks Table */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              یونانی‌های قرارداد (Greeks Analysis)
            </h3>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block mb-0.5">دلتا (Δ)</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  {contract.delta}
                </span>
                <span className="text-[10px] text-slate-500 block">تغییر به ازای ۱ ریال سهم</span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block mb-0.5">گاما (Γ)</span>
                <span className="font-mono font-bold text-white text-sm">
                  {contract.gamma}
                </span>
                <span className="text-[10px] text-slate-500 block">شتاب تغییر دلتا</span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block mb-0.5">تتا (Θ)</span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  {contract.theta}
                </span>
                <span className="text-[10px] text-slate-500 block">زوال زمانی روزانه (ریال)</span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block mb-0.5">وگا (V)</span>
                <span className="font-mono font-bold text-purple-300 text-sm">
                  {contract.vega}
                </span>
                <span className="text-[10px] text-slate-500 block">تغییر به ازای ۱٪ نوسان</span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block mb-0.5">نوسان ضمنی (IV)</span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  {(contract.iv * 100).toFixed(1)}٪
                </span>
                <span className="text-[10px] text-slate-500 block">انتظار بازار از نوسان</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            موقعیت‌های باز (Open Interest): <strong className="text-slate-200 font-mono">{formatNumber(contract.openInterest)}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onAddToStrategy(contract, 'buy');
                onClose();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              افزودن موقعیت خرید (Long) به Payoff
            </button>

            <button
              onClick={() => {
                onAddToStrategy(contract, 'sell');
                onClose();
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              افزودن موقعیت فروش (Short) به Payoff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
