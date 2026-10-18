/**
 * داده‌های مرجع و شبیه‌سازی بازار اختیار معامله بورس اوراق بهادار تهران (TSETMC)
 */

import { UnderlyingAsset, ExpirationDate, OptionChainRow, StrategyPreset, OrderBookRow } from '../types/options';
import { calculateOptionGreeks, calculateImpliedVolatility, getMoneyness } from '../utils/blackScholes';

export const UNDERLYING_ASSETS: UnderlyingAsset[] = [
  {
    symbol: 'اهرم',
    name: 'صندوق سرمایه‌گذاری طلایه‌داران اهرم',
    price: 21450,
    change: 550,
    changePct: 2.63,
    volume: 184500000,
    valueBillion: 3957.5,
    historicalVol: 0.42,
    high: 21800,
    low: 20900,
    totalOptionVolume: 42100000,
    totalOptionValue: 1240.2,
  },
  {
    symbol: 'خودرو',
    name: 'ایران خودرو',
    price: 2780,
    change: -40,
    changePct: -1.42,
    volume: 320400000,
    valueBillion: 890.7,
    historicalVol: 0.38,
    high: 2840,
    low: 2750,
    totalOptionVolume: 28900000,
    totalOptionValue: 620.4,
  },
  {
    symbol: 'طلا',
    name: 'صندوق طلای لوتوس',
    price: 27200,
    change: 410,
    changePct: 1.53,
    volume: 76500000,
    valueBillion: 2080.8,
    historicalVol: 0.28,
    high: 27500,
    low: 26900,
    totalOptionVolume: 19800000,
    totalOptionValue: 840.6,
  },
  {
    symbol: 'فملی',
    name: 'ملی صنایع مس ایران',
    price: 6850,
    change: 80,
    changePct: 1.18,
    volume: 98400000,
    valueBillion: 674.0,
    historicalVol: 0.31,
    high: 6920,
    low: 6780,
    totalOptionVolume: 12400000,
    totalOptionValue: 280.5,
  },
  {
    symbol: 'شستا',
    name: 'سرمایه‌گذاری تامین اجتماعی',
    price: 1195,
    change: 15,
    changePct: 1.27,
    volume: 245000000,
    valueBillion: 292.7,
    historicalVol: 0.33,
    high: 1210,
    low: 1180,
    totalOptionVolume: 8900000,
    totalOptionValue: 110.2,
  },
  {
    symbol: 'زعفران',
    name: 'صندوق زعفران نگین طلای سرخ',
    price: 88500,
    change: -1200,
    changePct: -1.34,
    volume: 14200000,
    valueBillion: 1256.7,
    historicalVol: 0.45,
    high: 90200,
    low: 87900,
    totalOptionVolume: 6400000,
    totalOptionValue: 415.0,
  },
];

export const EXPIRATION_DATES: ExpirationDate[] = [
  { date: '1405/02/28', daysToExpiration: 40, label: 'اردیبهشت ۱۴۰۵ (۴۰ روز)' },
  { date: '1405/04/15', daysToExpiration: 88, label: 'تیر ۱۴۰۵ (۸۸ روز)' },
  { date: '1405/06/30', daysToExpiration: 165, label: 'شهریور ۱۴۰۵ (۱۶۵ روز)' },
  { date: '1405/08/25', daysToExpiration: 221, label: 'آبان ۱۴۰۵ (۲۲۱ روز)' },
];

function generateOrderBook(midPrice: number): OrderBookRow[] {
  const spread = Math.max(1, Math.round(midPrice * 0.015));
  return [
    {
      bidVolume: 240,
      bidPrice: Math.round(midPrice - spread * 0.5),
      askPrice: Math.round(midPrice + spread * 0.5),
      askVolume: 180,
    },
    {
      bidVolume: 450,
      bidPrice: Math.round(midPrice - spread * 1.5),
      askPrice: Math.round(midPrice + spread * 1.5),
      askVolume: 320,
    },
    {
      bidVolume: 800,
      bidPrice: Math.round(midPrice - spread * 2.5),
      askPrice: Math.round(midPrice + spread * 2.5),
      askVolume: 610,
    },
    {
      bidVolume: 1200,
      bidPrice: Math.round(midPrice - spread * 3.5),
      askPrice: Math.round(midPrice + spread * 3.5),
      askVolume: 950,
    },
    {
      bidVolume: 2500,
      bidPrice: Math.round(midPrice - spread * 4.5),
      askPrice: Math.round(midPrice + spread * 4.5),
      askVolume: 1800,
    },
  ];
}

/**
 * تولید ماتریس زنجیره قراردادهای اختیار معامله بر اساس دارایی پایه و تاریخ سررسید
 */
export function generateOptionChain(underlyingSymbol: string, expDate: ExpirationDate): OptionChainRow[] {
  const asset = UNDERLYING_ASSETS.find((a) => a.symbol === underlyingSymbol) || UNDERLYING_ASSETS[0];
  const S = asset.price;
  const T = expDate.daysToExpiration / 365;
  const r = 0.30; // نرخ بدون ریسک ۳۰ درصد سالانه

  let step = 100;
  if (S > 5000 && S <= 15000) step = 500;
  else if (S > 15000 && S <= 50000) step = 1000;
  else if (S > 50000) step = 5000;

  const baseStrike = Math.round(S / step) * step;
  const offsets = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

  const rows: OptionChainRow[] = [];

  for (const offset of offsets) {
    const K = baseStrike + offset * step;
    if (K <= 0) continue;

    const pctDiff = Number((((K - S) / S) * 100).toFixed(1));

    // محاسبه قیمت تئوریک و یونانی‌ها با مدل بلک-شولز
    const callGreeks = calculateOptionGreeks(S, K, T, r, asset.historicalVol, 'call');
    const putGreeks = calculateOptionGreeks(S, K, T, r, asset.historicalVol, 'put');

    // ایجاد قیمت واقعی بازار با اندکی انحراف (پرمیوم بورس)
    const callSpreadFactor = 1 + (offset * -0.015) + (Math.sin(offset) * 0.02);
    const putSpreadFactor = 1 + (offset * 0.018) + (Math.cos(offset) * 0.02);

    const callMarketPrice = Math.max(10, Math.round(callGreeks.theoreticalPrice * callSpreadFactor));
    const putMarketPrice = Math.max(10, Math.round(putGreeks.theoreticalPrice * putSpreadFactor));

    const callIV = calculateImpliedVolatility(callMarketPrice, S, K, T, r, 'call');
    const putIV = calculateImpliedVolatility(putMarketPrice, S, K, T, r, 'put');

    const callMoneyness = getMoneyness(S, K, 'call');
    const putMoneyness = getMoneyness(S, K, 'put');

    const callIntrinsic = Math.max(0, S - K);
    const putIntrinsic = Math.max(0, K - S);

    const strikeCode = String(K).slice(-4);
    const dateCode = expDate.date.slice(5, 7); // ماه سررسید

    rows.push({
      strikePrice: K,
      pctDiffFromSpot: pctDiff,
      call: {
        symbol: `ض${asset.symbol.slice(0, 3)}${dateCode}${strikeCode}`,
        underlyingSymbol: asset.symbol,
        type: 'call',
        strikePrice: K,
        expirationDate: expDate.date,
        daysToExpiration: expDate.daysToExpiration,
        lastPrice: callMarketPrice,
        yesterdayPrice: Math.round(callMarketPrice * 0.96),
        changePct: Number((((callMarketPrice - Math.round(callMarketPrice * 0.96)) / Math.round(callMarketPrice * 0.96)) * 100).toFixed(2)),
        volume: 25000 + Math.abs(5 - Math.abs(offset)) * 14000,
        tradesCount: 320 + Math.abs(offset) * 45,
        valueRials: (25000 + Math.abs(5 - Math.abs(offset)) * 14000) * callMarketPrice * 1000,
        openInterest: 18400 + (4 - Math.abs(offset)) * 2800,
        openInterestChange: 420 - offset * 90,
        bidPrice: Math.max(10, Math.round(callMarketPrice * 0.985)),
        bidVolume: 450,
        askPrice: Math.round(callMarketPrice * 1.015),
        askVolume: 320,
        orderBook: generateOrderBook(callMarketPrice),
        iv: callIV,
        delta: callGreeks.delta,
        gamma: callGreeks.gamma,
        theta: callGreeks.theta,
        vega: callGreeks.vega,
        rho: callGreeks.rho,
        theoreticalPrice: callGreeks.theoreticalPrice,
        intrinsicValue: callIntrinsic,
        timeValue: Math.max(0, callMarketPrice - callIntrinsic),
        effectiveLeverage: Number((callGreeks.delta * (S / callMarketPrice)).toFixed(2)),
        moneyness: callMoneyness,
        breakEvenPrice: K + callMarketPrice,
        contractSize: 1000,
      },
      put: {
        symbol: `ط${asset.symbol.slice(0, 3)}${dateCode}${strikeCode}`,
        underlyingSymbol: asset.symbol,
        type: 'put',
        strikePrice: K,
        expirationDate: expDate.date,
        daysToExpiration: expDate.daysToExpiration,
        lastPrice: putMarketPrice,
        yesterdayPrice: Math.round(putMarketPrice * 1.03),
        changePct: Number((((putMarketPrice - Math.round(putMarketPrice * 1.03)) / Math.round(putMarketPrice * 1.03)) * 100).toFixed(2)),
        volume: 18000 + Math.abs(5 - Math.abs(offset)) * 9500,
        tradesCount: 210 + Math.abs(offset) * 30,
        valueRials: (18000 + Math.abs(5 - Math.abs(offset)) * 9500) * putMarketPrice * 1000,
        openInterest: 12600 + (4 - Math.abs(offset)) * 1900,
        openInterestChange: 280 + offset * 60,
        bidPrice: Math.max(10, Math.round(putMarketPrice * 0.985)),
        bidVolume: 280,
        askPrice: Math.round(putMarketPrice * 1.015),
        askVolume: 410,
        orderBook: generateOrderBook(putMarketPrice),
        iv: putIV,
        delta: putGreeks.delta,
        gamma: putGreeks.gamma,
        theta: putGreeks.theta,
        vega: putGreeks.vega,
        rho: putGreeks.rho,
        theoreticalPrice: putGreeks.theoreticalPrice,
        intrinsicValue: putIntrinsic,
        timeValue: Math.max(0, putMarketPrice - putIntrinsic),
        effectiveLeverage: Number((Math.abs(putGreeks.delta) * (S / putMarketPrice)).toFixed(2)),
        moneyness: putMoneyness,
        breakEvenPrice: Math.max(0, K - putMarketPrice),
        contractSize: 1000,
      },
    });
  }

  return rows;
}

/**
 * الگوهای آماده استراتژی‌های معاملاتی آپشن
 */
export const STRATEGY_PRESETS: StrategyPreset[] = [
  {
    id: 'covered_call',
    name: 'کاور کال (Covered Call)',
    englishName: 'Covered Call',
    outlook: 'neutral',
    description: 'خرید یا نگهداری سهم پایه همراه با فروش اختیار خرید (کال OTM) جهت کسب درآمد از پرمیوم و زوال زمانی.',
    buildLegs: (spot, step) => [
      { type: 'stock', action: 'buy', strike: spot, premium: spot, quantity: 1, contractSize: 1000 },
      { type: 'call', action: 'sell', strike: spot + step, premium: Math.round(spot * 0.04), quantity: 1, contractSize: 1000 },
    ],
  },
  {
    id: 'bull_call_spread',
    name: 'اسپرد صعودی کال (Bull Call Spread)',
    englishName: 'Bull Call Spread',
    outlook: 'bullish',
    description: 'خرید کال با قیمت اعمال پایین‌تر و فروش کال با قیمت اعمال بالاتر. محدود کردن ریسک و هزینه ورود.',
    buildLegs: (spot, step) => [
      { type: 'call', action: 'buy', strike: spot, premium: Math.round(spot * 0.05), quantity: 1, contractSize: 1000 },
      { type: 'call', action: 'sell', strike: spot + step, premium: Math.round(spot * 0.025), quantity: 1, contractSize: 1000 },
    ],
  },
  {
    id: 'bear_put_spread',
    name: 'اسپرد نزولی پوت (Bear Put Spread)',
    englishName: 'Bear Put Spread',
    outlook: 'bearish',
    description: 'خرید پوت با قیمت اعمال بالاتر و فروش پوت با قیمت اعمال پایین‌تر جهت سودآوری از افت سهم با ریسک کنترل‌شده.',
    buildLegs: (spot, step) => [
      { type: 'put', action: 'buy', strike: spot, premium: Math.round(spot * 0.045), quantity: 1, contractSize: 1000 },
      { type: 'put', action: 'sell', strike: spot - step, premium: Math.round(spot * 0.02), quantity: 1, contractSize: 1000 },
    ],
  },
  {
    id: 'long_straddle',
    name: 'استرادل خرید (Long Straddle)',
    englishName: 'Long Straddle',
    outlook: 'high_volatility',
    description: 'خرید همزمان کال و پوت در یک قیمت اعمال یکسان (ATM). سودآوری حداکثری در صورت جهش یا سقوط شارپ قیمت.',
    buildLegs: (spot, _step) => [
      { type: 'call', action: 'buy', strike: spot, premium: Math.round(spot * 0.05), quantity: 1, contractSize: 1000 },
      { type: 'put', action: 'buy', strike: spot, premium: Math.round(spot * 0.045), quantity: 1, contractSize: 1000 },
    ],
  },
  {
    id: 'short_strangle',
    name: 'استرانگل فروش (Short Strangle)',
    englishName: 'Short Strangle',
    outlook: 'low_volatility',
    description: 'فروش همزمان کال OTM و پوت OTM. دریافت حداکثر پرمیوم در صورت نوسان اندک قیمت تا سررسید.',
    buildLegs: (spot, step) => [
      { type: 'call', action: 'sell', strike: spot + step, premium: Math.round(spot * 0.03), quantity: 1, contractSize: 1000 },
      { type: 'put', action: 'sell', strike: spot - step, premium: Math.round(spot * 0.025), quantity: 1, contractSize: 1000 },
    ],
  },
  {
    id: 'iron_condor',
    name: 'کندور آهنی (Iron Condor)',
    englishName: 'Iron Condor',
    outlook: 'low_volatility',
    description: 'ترکیب اسپرد اعتباری کال و اسپرد اعتباری پوت. سودآوری در بازه نوسانی بدون ریسک زیان نامحدود.',
    buildLegs: (spot, step) => [
      { type: 'put', action: 'buy', strike: spot - 2 * step, premium: Math.round(spot * 0.012), quantity: 1, contractSize: 1000 },
      { type: 'put', action: 'sell', strike: spot - step, premium: Math.round(spot * 0.028), quantity: 1, contractSize: 1000 },
      { type: 'call', action: 'sell', strike: spot + step, premium: Math.round(spot * 0.032), quantity: 1, contractSize: 1000 },
      { type: 'call', action: 'buy', strike: spot + 2 * step, premium: Math.round(spot * 0.015), quantity: 1, contractSize: 1000 },
    ],
  },
  {
    id: 'protective_put',
    name: 'پوت محافظتی یا بیمه سهام (Protective Put)',
    englishName: 'Protective Put',
    outlook: 'bullish',
    description: 'خرید سهم پایه و خرید همزمان اختیار فروش به عنوان بیمه‌نامه در برابر ریزش قیمت.',
    buildLegs: (spot, step) => [
      { type: 'stock', action: 'buy', strike: spot, premium: spot, quantity: 1, contractSize: 1000 },
      { type: 'put', action: 'buy', strike: spot - step, premium: Math.round(spot * 0.03), quantity: 1, contractSize: 1000 },
    ],
  },
];
