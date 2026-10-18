import React, { useState, useMemo } from 'react';
import { StrategyLeg, StrategyPreset } from '../types/options';
import { STRATEGY_PRESETS, UNDERLYING_ASSETS } from '../data/mockTseData';
import { calculatePayoff, formatNumber, formatRials, formatToman } from '../utils/blackScholes';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2, Layers } from 'lucide-react';

interface PayoffCalculatorProps {
  initialLegs?: StrategyLeg[];
  currentSpotPrice?: number;
}

export const PayoffCalculator: React.FC<PayoffCalculatorProps> = ({
  initialLegs,
  currentSpotPrice = 21450,
}) => {
  const [spotPrice, setSpotPrice] = useState<number>(currentSpotPrice);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('bull_call_spread');
  const [hoveredPoint, setHoveredPoint] = useState<{ price: number; pnl: number } | null>(null);

  // پوزیشن‌های پیش‌فرض
  const [legs, setLegs] = useState<StrategyLeg[]>(() => {
    if (initialLegs && initialLegs.length > 0) return initialLegs;
    const preset = STRATEGY_PRESETS.find((p) => p.id === 'bull_call_spread')!;
    const built = preset.buildLegs(currentSpotPrice, 1000);
    return built.map((leg, idx) => ({ ...leg, id: `leg-${Date.now()}-${idx}` }));
  });

  // اعمال استراتژی آماده
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = STRATEGY_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const step = spotPrice > 15000 ? 1000 : 200;
      const built = preset.buildLegs(spotPrice, step);
      setLegs(built.map((leg, idx) => ({ ...leg, id: `leg-${Date.now()}-${idx}` })));
    }
  };

  // افزودن پوزیشن جدید
  const handleAddLeg = () => {
    const newLeg: StrategyLeg = {
      id: `leg-${Date.now()}`,
      type: 'call',
      action: 'buy',
      strike: spotPrice,
      premium: Math.round(spotPrice * 0.04),
      quantity: 1,
      contractSize: 1000,
    };
    setLegs((prev) => [...prev, newLeg]);
    setSelectedPresetId('custom');
  };

  // حذف پوزیشن
  const handleDeleteLeg = (id: string) => {
    setLegs((prev) => prev.filter((leg) => leg.id !== id));
    setSelectedPresetId('custom');
  };

  // ویرایش پوزیشن
  const handleUpdateLeg = (id: string, updates: Partial<StrategyLeg>) => {
    setLegs((prev) =>
      prev.map((leg) => (leg.id === id ? { ...leg, ...updates } : leg))
    );
    setSelectedPresetId('custom');
  };

  // محاسبه خروجی سود و زیان (Payoff)
  const payoffData = useMemo(() => {
    return calculatePayoff(legs, spotPrice, 0.35, 100);
  }, [legs, spotPrice]);

  // مقیاس‌بندی و تبدیل مختصات به نمودار SVG
  const svgMetrics = useMemo(() => {
    if (payoffData.prices.length === 0) return null;

    const width = 800;
    const height = 360;
    const padding = { top: 30, right: 40, bottom: 40, left: 70 };

    const minX = payoffData.prices[0];
    const maxX = payoffData.prices[payoffData.prices.length - 1];

    const rawMinY = Math.min(...payoffData.pnl);
    const rawMaxY = Math.max(...payoffData.pnl);

    // تضمین قرار گرفتن خط صفر در محور عمودی
    const minY = Math.min(rawMinY, -10000);
    const maxY = Math.max(rawMaxY, 10000);

    const scaleX = (x: number) =>
      padding.left + ((x - minX) / (maxX - minX)) * (width - padding.left - padding.right);

    const scaleY = (y: number) =>
      height - padding.bottom - ((y - minY) / (maxY - minY)) * (height - padding.top - padding.bottom);

    // مسیر خط سود و زیان
    const pathD = payoffData.prices
      .map((p, idx) => {
        const x = scaleX(p);
        const y = scaleY(payoffData.pnl[idx]);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    // خط افقی تراز صفر
    const zeroY = scaleY(0);

    // ساخت چندضلعی ناحیه سبز (سود) و قرمز (زیان)
    const profitPolygonPoints: string[] = [];
    const lossPolygonPoints: string[] = [];

    payoffData.prices.forEach((p, idx) => {
      const x = scaleX(p);
      const y = scaleY(payoffData.pnl[idx]);
      if (payoffData.pnl[idx] >= 0) {
        profitPolygonPoints.push(`${x},${y}`);
      } else {
        lossPolygonPoints.push(`${x},${y}`);
      }
    });

    const spotX = scaleX(spotPrice);

    return {
      width,
      height,
      padding,
      minX,
      maxX,
      minY,
      maxY,
      scaleX,
      scaleY,
      pathD,
      zeroY,
      spotX,
    };
  }, [payoffData, spotPrice]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header Toolbar & Strategy Preset Picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
              ماشین‌حساب سود و زیان استراتژی‌های ترکیبی (Payoff Diagram)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مدل‌سازی سود و زیان در تاریخ سررسید، محاسبه دقیق نقاط سر‌به‌سر و حساسیت‌های کل سبد
            </p>
          </div>

          {/* Strategy Presets Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 whitespace-nowrap">الگوی استراتژی:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {STRATEGY_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="custom">استراتژی سفارشی (Custom)</option>
            </select>
          </div>
        </div>

        {/* Preset Description */}
        {selectedPresetId !== 'custom' && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300">
            <strong className="text-emerald-400 ml-1">توضیح الگو:</strong>
            {STRATEGY_PRESETS.find((p) => p.id === selectedPresetId)?.description}
          </div>
        )}
      </div>

      {/* 2. Strategy Metrics & Key Performance Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-0.5">حداکثر سود (Max Profit)</span>
          <span className="text-base font-bold text-emerald-400 font-mono">
            {typeof payoffData.maxProfit === 'number'
              ? `${formatRials(payoffData.maxProfit)} ریال`
              : payoffData.maxProfit}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {typeof payoffData.maxProfit === 'number' && `(${formatToman(payoffData.maxProfit)} ت)`}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-0.5">حداکثر زیان (Max Loss)</span>
          <span className="text-base font-bold text-rose-400 font-mono">
            {typeof payoffData.maxLoss === 'number'
              ? `${formatRials(payoffData.maxLoss)} ریال`
              : payoffData.maxLoss}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {typeof payoffData.maxLoss === 'number' && `(${formatToman(payoffData.maxLoss)} ت)`}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-0.5">نقاط سر‌به‌سر (Break-Even)</span>
          <span className="text-sm font-bold text-amber-300 font-mono block truncate">
            {payoffData.breakEvens.length > 0
              ? payoffData.breakEvens.map((b) => formatRials(b)).join(' و ')
              : 'فاقد نقطه سربه سر'}
          </span>
          <span className="text-[10px] text-slate-500 block">قیمت سهم در سررسید</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-0.5">هزینه اولیه / اعتبار</span>
          <span className="text-base font-bold text-cyan-300 font-mono">
            {formatRials(Math.abs(payoffData.netDebitCredit))} ریال
          </span>
          <span className="text-[10px] text-slate-500 block">
            {payoffData.netDebitCredit > 0 ? 'پرداخت اولیه (Debit)' : 'دریافت اعتبار (Credit)'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-0.5">دلتای کل سبد (Δ)</span>
          <span className="text-base font-bold text-white font-mono">
            {payoffData.totalDelta}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {payoffData.totalDelta > 0 ? 'جهت‌گیری صعودی' : payoffData.totalDelta < 0 ? 'جهت‌گیری نزولی' : 'بی‌طرف (Delta Neutral)'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-0.5">تتای روزانه کل (Θ)</span>
          <span
            className={`text-base font-bold font-mono ${
              payoffData.totalTheta >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatRials(payoffData.totalTheta)} ریال
          </span>
          <span className="text-[10px] text-slate-500 block">سود/زیان گذشت ۱ شبانه‌روز</span>
        </div>
      </div>

      {/* 3. Interactive Payoff Chart (SVG) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 relative shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              ناحیه سود (Profit)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              ناحیه زیان (Loss)
            </span>
            <span className="flex items-center gap-1.5 text-amber-300 font-medium">
              <span className="w-2 h-2 rotate-45 bg-amber-400 inline-block" />
              نقطه سر‌به‌سر
            </span>
          </div>

          {hoveredPoint && (
            <div className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-700 text-xs font-mono">
              <span className="text-slate-400 ml-1">قیمت:</span>
              <strong className="text-white">{formatRials(hoveredPoint.price)}</strong>
              <span className="text-slate-400 mx-2">|</span>
              <span className="text-slate-400 ml-1">سود/زیان:</span>
              <strong className={hoveredPoint.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {formatRials(hoveredPoint.pnl)} ریال
              </strong>
            </div>
          )}
        </div>

        {/* SVG Drawing Area */}
        {svgMetrics && (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}
              className="w-full h-auto min-w-[650px] select-none"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="profitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lossGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={svgMetrics.padding.left}
                y1={svgMetrics.zeroY}
                x2={svgMetrics.width - svgMetrics.padding.right}
                y2={svgMetrics.zeroY}
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Current Spot Price Vertical Line */}
              <line
                x1={svgMetrics.spotX}
                y1={svgMetrics.padding.top}
                x2={svgMetrics.spotX}
                y2={svgMetrics.height - svgMetrics.padding.bottom}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="2 3"
              />
              <text
                x={svgMetrics.spotX}
                y={svgMetrics.padding.top - 8}
                fill="#22d3ee"
                fontSize="10"
                textAnchor="middle"
                className="font-mono"
              >
                قیمت فعلی: {formatRials(spotPrice)}
              </text>

              {/* Payoff Curve Line */}
              <path
                d={svgMetrics.pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Break-even Markers */}
              {payoffData.breakEvens.map((be, idx) => {
                const x = svgMetrics.scaleX(be);
                return (
                  <g key={idx}>
                    <circle cx={x} cy={svgMetrics.zeroY} r="5" fill="#f59e0b" />
                    <text
                      x={x}
                      y={svgMetrics.zeroY + 18}
                      fill="#f59e0b"
                      fontSize="10"
                      textAnchor="middle"
                      className="font-mono font-bold"
                    >
                      {formatRials(be)}
                    </text>
                  </g>
                );
              })}

              {/* Interactive Hover Point Tracking */}
              {payoffData.prices.map((p, idx) => {
                const x = svgMetrics.scaleX(p);
                const y = svgMetrics.scaleY(payoffData.pnl[idx]);
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="8"
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoveredPoint({ price: p, pnl: payoffData.pnl[idx] })}
                  />
                );
              })}

              {/* X Axis Labels */}
              <text
                x={svgMetrics.padding.left}
                y={svgMetrics.height - 12}
                fill="#94a3b8"
                fontSize="11"
                className="font-mono"
              >
                {formatRials(svgMetrics.minX)}
              </text>
              <text
                x={svgMetrics.width - svgMetrics.padding.right}
                y={svgMetrics.height - 12}
                fill="#94a3b8"
                fontSize="11"
                textAnchor="end"
                className="font-mono"
              >
                {formatRials(svgMetrics.maxX)}
              </text>
              <text
                x={svgMetrics.width / 2}
                y={svgMetrics.height - 12}
                fill="#94a3b8"
                fontSize="11"
                textAnchor="middle"
              >
                قیمت سهم پایه در سررسید (ریال)
              </text>

              {/* Y Axis Zero Label */}
              <text
                x={svgMetrics.padding.left - 10}
                y={svgMetrics.zeroY + 4}
                fill="#94a3b8"
                fontSize="11"
                textAnchor="end"
                className="font-mono font-bold"
              >
                ۰
              </text>
            </svg>
          </div>
        )}
      </div>

      {/* 4. Strategy Legs Table (Position Management) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              ترکیب موقعیت‌های استراتژی (Strategy Legs)
            </h3>
            <span className="text-xs text-slate-400">({legs.length} موقعیت)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Spot Price adjuster */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span>قیمت سهم پایه:</span>
              <input
                type="number"
                value={spotPrice}
                onChange={(e) => setSpotPrice(Number(e.target.value) || 1)}
                className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-center focus:outline-none focus:border-emerald-500"
              />
              <span>ریال</span>
            </div>

            <button
              onClick={handleAddLeg}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              افزودن موقعیت (Leg)
            </button>
          </div>
        </div>

        {/* Legs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-2.5 px-3">نوع دارایی</th>
                <th className="py-2.5 px-3">عملکرد</th>
                <th className="py-2.5 px-3">قیمت اعمال (ریال)</th>
                <th className="py-2.5 px-3">پرمیوم / قیمت (ریال)</th>
                <th className="py-2.5 px-3">تعداد قرارداد</th>
                <th className="py-2.5 px-3">ضریب سهم</th>
                <th className="py-2.5 px-3">جریان نقد کل (ریال)</th>
                <th className="py-2.5 px-3 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {legs.map((leg) => {
                const totalCashflow =
                  (leg.action === 'buy' ? -1 : 1) * leg.premium * leg.quantity * leg.contractSize;

                return (
                  <tr key={leg.id} className="hover:bg-slate-850/50 transition-colors">
                    {/* Leg Type */}
                    <td className="py-2.5 px-3">
                      <select
                        value={leg.type}
                        onChange={(e) =>
                          handleUpdateLeg(leg.id, { type: e.target.value as any })
                        }
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="call">اختیار خرید (Call)</option>
                        <option value="put">اختیار فروش (Put)</option>
                        <option value="stock">سهم پایه (Stock)</option>
                      </select>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3">
                      <select
                        value={leg.action}
                        onChange={(e) =>
                          handleUpdateLeg(leg.id, { action: e.target.value as any })
                        }
                        className={`border rounded px-2 py-1 text-xs font-semibold ${
                          leg.action === 'buy'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : 'bg-rose-950 text-rose-300 border-rose-700'
                        }`}
                      >
                        <option value="buy">خرید (Long)</option>
                        <option value="sell">فروش (Short)</option>
                      </select>
                    </td>

                    {/* Strike */}
                    <td className="py-2.5 px-3">
                      {leg.type === 'stock' ? (
                        <span className="text-slate-500 font-mono">-</span>
                      ) : (
                        <input
                          type="number"
                          value={leg.strike}
                          onChange={(e) =>
                            handleUpdateLeg(leg.id, { strike: Number(e.target.value) || 0 })
                          }
                          className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-white text-right"
                        />
                      )}
                    </td>

                    {/* Premium */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        value={leg.premium}
                        onChange={(e) =>
                          handleUpdateLeg(leg.id, { premium: Number(e.target.value) || 0 })
                        }
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-white text-right"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="1"
                        value={leg.quantity}
                        onChange={(e) =>
                          handleUpdateLeg(leg.id, {
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-white text-center"
                      />
                    </td>

                    {/* Contract Size */}
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {formatNumber(leg.contractSize)}
                    </td>

                    {/* Total Cashflow */}
                    <td
                      className={`py-2.5 px-3 font-mono font-semibold ${
                        totalCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatRials(totalCashflow)}
                    </td>

                    {/* Delete */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteLeg(leg.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="حذف این موقعیت"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
