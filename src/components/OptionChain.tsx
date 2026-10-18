import React, { useState, useMemo } from 'react';
import { UnderlyingAsset, ExpirationDate, OptionChainRow, OptionContract, Moneyness } from '../types/options';
import { UNDERLYING_ASSETS, EXPIRATION_DATES, generateOptionChain } from '../data/mockTseData';
import { formatNumber, formatRials } from '../utils/blackScholes';
import { ContractDetailModal } from './ContractDetailModal';
import { Search, Plus, Filter, Info, ChevronDown, Sparkles } from 'lucide-react';

interface OptionChainProps {
  onAddToStrategy: (contract: OptionContract, action: 'buy' | 'sell') => void;
  onNavigateToPayoff: () => void;
}

export const OptionChain: React.FC<OptionChainProps> = ({
  onAddToStrategy,
  onNavigateToPayoff,
}) => {
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>('اهرم');
  const [selectedExpDate, setSelectedExpDate] = useState<ExpirationDate>(EXPIRATION_DATES[0]);
  const [moneynessFilter, setMoneynessFilter] = useState<'all' | 'itm' | 'atm' | 'otm'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedModalContract, setSelectedModalContract] = useState<OptionContract | null>(null);

  const currentAsset = useMemo(() => {
    return UNDERLYING_ASSETS.find((a) => a.symbol === selectedAssetSymbol) || UNDERLYING_ASSETS[0];
  }, [selectedAssetSymbol]);

  // تولید ماتریس زنجیره قراردادها
  const chainRows = useMemo(() => {
    return generateOptionChain(selectedAssetSymbol, selectedExpDate);
  }, [selectedAssetSymbol, selectedExpDate]);

  // فیلتر کردن ردیف‌ها
  const filteredRows = useMemo(() => {
    return chainRows.filter((row) => {
      // فیلتر جستجو
      if (searchTerm) {
        const matchesStrike = row.strikePrice.toString().includes(searchTerm);
        const matchesCall = row.call.symbol.includes(searchTerm);
        const matchesPut = row.put.symbol.includes(searchTerm);
        if (!matchesStrike && !matchesCall && !matchesPut) return false;
      }

      // فیلتر وضعیت سودآوری
      if (moneynessFilter === 'itm') {
        return row.call.moneyness === 'ITM' || row.put.moneyness === 'ITM';
      }
      if (moneynessFilter === 'atm') {
        return row.call.moneyness === 'ATM' || row.put.moneyness === 'ATM';
      }
      if (moneynessFilter === 'otm') {
        return row.call.moneyness === 'OTM' || row.put.moneyness === 'OTM';
      }

      return true;
    });
  }, [chainRows, searchTerm, moneynessFilter]);

  // محاسبات تجمیعی زنجیره
  const chainSummary = useMemo(() => {
    const totalCallVol = filteredRows.reduce((acc, r) => acc + r.call.volume, 0);
    const totalPutVol = filteredRows.reduce((acc, r) => acc + r.put.volume, 0);
    const totalCallOI = filteredRows.reduce((acc, r) => acc + r.call.openInterest, 0);
    const totalPutOI = filteredRows.reduce((acc, r) => acc + r.put.openInterest, 0);
    const pcVolRatio = totalCallVol > 0 ? (totalPutVol / totalCallVol).toFixed(2) : '۰';
    const pcOIRatio = totalCallOI > 0 ? (totalPutOI / totalCallOI).toFixed(2) : '۰';

    return {
      totalCallVol,
      totalPutVol,
      totalCallOI,
      totalPutOI,
      pcVolRatio,
      pcOIRatio,
    };
  }, [filteredRows]);

  return (
    <div className="space-y-5" dir="rtl">
      {/* 1. Underlying Asset Selector Strip & Quick Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Asset Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-1">
              نماد پایه:
            </span>
            {UNDERLYING_ASSETS.map((asset) => {
              const isSelected = asset.symbol === selectedAssetSymbol;
              return (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedAssetSymbol(asset.symbol)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20 font-bold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {asset.symbol}
                  <span className="text-[10px] opacity-75 mr-1 font-normal">
                    ({asset.changePct > 0 ? '+' : ''}{asset.changePct}٪)
                  </span>
                </button>
              );
            })}
          </div>

          {/* Asset Detailed Metrics Strip */}
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div>
              <span className="text-slate-400 block text-[11px]">قیمت پایانی {currentAsset.name}:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-base font-bold text-white">
                  {formatRials(currentAsset.price)}
                </span>
                <span
                  className={`font-semibold ${
                    currentAsset.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {currentAsset.changePct >= 0 ? '+' : ''}
                  {currentAsset.changePct}٪ ({formatRials(currentAsset.change)})
                </span>
              </div>
            </div>

            <div className="h-7 w-[1px] bg-slate-800 hidden sm:block" />

            <div>
              <span className="text-slate-400 block text-[11px]">بازه روز (Low - High):</span>
              <span className="font-mono text-slate-300">
                {formatRials(currentAsset.low)} - {formatRials(currentAsset.high)}
              </span>
            </div>

            <div className="h-7 w-[1px] bg-slate-800 hidden sm:block" />

            <div>
              <span className="text-slate-400 block text-[11px]">نوسان تاریخی (HV):</span>
              <span className="font-mono text-amber-300 font-semibold">
                {(currentAsset.historicalVol * 100).toFixed(1)}٪
              </span>
            </div>

            <div className="h-7 w-[1px] bg-slate-800 hidden sm:block" />

            <div>
              <span className="text-slate-400 block text-[11px]">ارزش معاملات آپشن:</span>
              <span className="font-mono text-cyan-300 font-semibold">
                {formatRials(currentAsset.totalOptionValue)} م.ر
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Expiration Tabs & Search / Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
        {/* Expiration Date Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">
            تاریخ سررسید:
          </span>
          {EXPIRATION_DATES.map((exp) => {
            const isSelected = exp.date === selectedExpDate.date;
            return (
              <button
                key={exp.date}
                onClick={() => setSelectedExpDate(exp)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {exp.label}
              </button>
            );
          })}
        </div>

        {/* Filter & Search Controls */}
        <div className="flex items-center gap-3">
          {/* Moneyness Segmented Filter */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setMoneynessFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                moneynessFilter === 'all'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              همه
            </button>
            <button
              onClick={() => setMoneynessFilter('itm')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                moneynessFilter === 'itm'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              در سود (ITM)
            </button>
            <button
              onClick={() => setMoneynessFilter('atm')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                moneynessFilter === 'atm'
                  ? 'bg-amber-500/20 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              سر‌به‌سر (ATM)
            </button>
            <button
              onClick={() => setMoneynessFilter('otm')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                moneynessFilter === 'otm'
                  ? 'bg-rose-500/20 text-rose-300 font-medium'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              در زیان (OTM)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجوی نماد یا اعمال..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 w-40 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* 3. Option Chain Matrix (Table) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* Table Super Header */}
        <div className="grid grid-cols-12 text-center text-xs font-bold border-b border-slate-800">
          <div className="col-span-5 bg-emerald-950/40 py-2.5 text-emerald-400 border-l border-slate-800 flex items-center justify-center gap-2">
            <span>اختیار خرید (Call Option)</span>
            <span className="text-[10px] text-emerald-500/80 font-normal">
              حجم: {formatNumber(chainSummary.totalCallVol)} | موقعیت باز: {formatNumber(chainSummary.totalCallOI)}
            </span>
          </div>

          <div className="col-span-2 bg-slate-950 py-2.5 text-slate-300 border-l border-slate-800">
            قیمت اعمال (Strike)
          </div>

          <div className="col-span-5 bg-rose-950/40 py-2.5 text-rose-400 flex items-center justify-center gap-2">
            <span>اختیار فروش (Put Option)</span>
            <span className="text-[10px] text-rose-500/80 font-normal">
              حجم: {formatNumber(chainSummary.totalPutVol)} | موقعیت باز: {formatNumber(chainSummary.totalPutOI)}
            </span>
          </div>
        </div>

        {/* Column Subheaders */}
        <div className="grid grid-cols-12 text-[11px] font-medium text-slate-400 bg-slate-950/90 py-2 border-b border-slate-800 text-center font-mono">
          {/* Call Columns */}
          <div className="col-span-5 grid grid-cols-6 border-l border-slate-800 px-1">
            <span className="col-span-1">افزودن</span>
            <span className="col-span-1">نماد</span>
            <span className="col-span-1">آخرین معامله</span>
            <span className="col-span-1">حجم</span>
            <span className="col-span-1">موقعیت باز</span>
            <span className="col-span-1">IV / دلتا</span>
          </div>

          {/* Center Column */}
          <div className="col-span-2 border-l border-slate-800">
            اعمال (فاصله از سهم)
          </div>

          {/* Put Columns */}
          <div className="col-span-5 grid grid-cols-6 px-1">
            <span className="col-span-1">IV / دلتا</span>
            <span className="col-span-1">موقعیت باز</span>
            <span className="col-span-1">حجم</span>
            <span className="col-span-1">آخرین معامله</span>
            <span className="col-span-1">نماد</span>
            <span className="col-span-1">افزودن</span>
          </div>
        </div>

        {/* Matrix Rows */}
        <div className="divide-y divide-slate-850 max-h-[600px] overflow-y-auto">
          {filteredRows.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              هیچ قراردادی با فیلترهای انتخاب‌شده یافت نشد.
            </div>
          ) : (
            filteredRows.map((row) => {
              const isCallITM = row.call.moneyness === 'ITM';
              const isPutITM = row.put.moneyness === 'ITM';
              const isATM = row.call.moneyness === 'ATM' || row.put.moneyness === 'ATM';

              return (
                <div
                  key={row.strikePrice}
                  className="grid grid-cols-12 items-center text-xs text-center py-2 hover:bg-slate-800/40 transition-colors font-mono"
                >
                  {/* Call Side */}
                  <div
                    className={`col-span-5 grid grid-cols-6 items-center py-1.5 px-2 border-l border-slate-850 cursor-pointer transition-colors ${
                      isCallITM
                        ? 'bg-emerald-950/25 hover:bg-emerald-950/40 text-emerald-100'
                        : 'hover:bg-slate-800/60 text-slate-200'
                    }`}
                    onClick={() => setSelectedModalContract(row.call)}
                  >
                    {/* Add to Payoff button */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToStrategy(row.call, 'buy');
                        }}
                        title="افزودن خرید کال به استراتژی"
                        className="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Symbol */}
                    <div className="col-span-1 text-right font-sans font-bold text-slate-100 truncate pr-1">
                      {row.call.symbol}
                      {isCallITM && (
                        <span className="text-[9px] text-emerald-400 block font-normal">ITM</span>
                      )}
                    </div>

                    {/* Last Price */}
                    <div className="col-span-1 text-slate-100 font-semibold">
                      {formatRials(row.call.lastPrice)}
                      <span
                        className={`text-[10px] block ${
                          row.call.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {row.call.changePct > 0 ? '+' : ''}{row.call.changePct}٪
                      </span>
                    </div>

                    {/* Volume */}
                    <div className="col-span-1 text-slate-300">
                      {formatNumber(row.call.volume)}
                    </div>

                    {/* Open Interest */}
                    <div className="col-span-1 text-slate-400">
                      {formatNumber(row.call.openInterest)}
                    </div>

                    {/* IV / Delta */}
                    <div className="col-span-1 text-slate-300">
                      <span className="text-amber-300 font-semibold block">
                        {(row.call.iv * 100).toFixed(0)}٪
                      </span>
                      <span className="text-[10px] text-cyan-300 block">
                        Δ {row.call.delta}
                      </span>
                    </div>
                  </div>

                  {/* Center Strike Column */}
                  <div
                    className={`col-span-2 py-1.5 border-l border-slate-850 font-bold ${
                      isATM
                        ? 'bg-amber-500/10 text-amber-300 border-y border-amber-500/30'
                        : 'bg-slate-950/80 text-white'
                    }`}
                  >
                    <div className="text-sm">{formatRials(row.strikePrice)}</div>
                    <div
                      className={`text-[10px] font-normal ${
                        row.pctDiffFromSpot > 0
                          ? 'text-cyan-400'
                          : row.pctDiffFromSpot < 0
                          ? 'text-purple-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {row.pctDiffFromSpot > 0 ? '+' : ''}
                      {row.pctDiffFromSpot}٪
                    </div>
                  </div>

                  {/* Put Side */}
                  <div
                    className={`col-span-5 grid grid-cols-6 items-center py-1.5 px-2 cursor-pointer transition-colors ${
                      isPutITM
                        ? 'bg-rose-950/25 hover:bg-rose-950/40 text-rose-100'
                        : 'hover:bg-slate-800/60 text-slate-200'
                    }`}
                    onClick={() => setSelectedModalContract(row.put)}
                  >
                    {/* IV / Delta */}
                    <div className="col-span-1 text-slate-300">
                      <span className="text-amber-300 font-semibold block">
                        {(row.put.iv * 100).toFixed(0)}٪
                      </span>
                      <span className="text-[10px] text-cyan-300 block">
                        Δ {row.put.delta}
                      </span>
                    </div>

                    {/* Open Interest */}
                    <div className="col-span-1 text-slate-400">
                      {formatNumber(row.put.openInterest)}
                    </div>

                    {/* Volume */}
                    <div className="col-span-1 text-slate-300">
                      {formatNumber(row.put.volume)}
                    </div>

                    {/* Last Price */}
                    <div className="col-span-1 text-slate-100 font-semibold">
                      {formatRials(row.put.lastPrice)}
                      <span
                        className={`text-[10px] block ${
                          row.put.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {row.put.changePct > 0 ? '+' : ''}{row.put.changePct}٪
                      </span>
                    </div>

                    {/* Symbol */}
                    <div className="col-span-1 text-right font-sans font-bold text-slate-100 truncate pr-1">
                      {row.put.symbol}
                      {isPutITM && (
                        <span className="text-[9px] text-rose-400 block font-normal">ITM</span>
                      )}
                    </div>

                    {/* Add to Payoff button */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToStrategy(row.put, 'buy');
                        }}
                        title="افزودن خرید پوت به استراتژی"
                        className="p-1 rounded bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer Summary Bar */}
        <div className="bg-slate-950 p-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span>
              نسبت حجم P/C این نماد: <strong className="text-white font-mono">{chainSummary.pcVolRatio}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>
              نسبت موقعیت باز P/C: <strong className="text-white font-mono">{chainSummary.pcOIRatio}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>
              کل حجم زنجیره: <strong className="text-white font-mono">{formatNumber(chainSummary.totalCallVol + chainSummary.totalPutVol)}</strong>
            </span>
          </div>

          <button
            onClick={onNavigateToPayoff}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            رفتن به ماشین‌حساب Payoff و تست سناریوها ←
          </button>
        </div>
      </div>

      {/* Contract Detail Modal */}
      <ContractDetailModal
        contract={selectedModalContract}
        underlyingPrice={currentAsset.price}
        onClose={() => setSelectedModalContract(null)}
        onAddToStrategy={onAddToStrategy}
      />
    </div>
  );
};
