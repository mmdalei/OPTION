/**
 * موتور محاسبات بلک-شولز و توابع مالی اختیار معامله به زبان تایپ‌اسکریپت
 * Black-Scholes Formula, Greeks, Implied Volatility & Payoff Engine
 */

import { StrategyLeg, PayoffCalculation, OptionType, Moneyness } from '../types/options';

/**
 * تقریب با دقت بالا برای تابع توزیع تجمعی نرمال استاندارد (Abramowitz & Stegun)
 * دقت بهتر از 7.5e-8
 */
export function normalCdf(x: number): number {
  if (isNaN(x)) return 0;
  if (x < -7) return 0;
  if (x > 7) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * absX);
  const erf = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * erf);
}

/**
 * تابع چگالی احتمال توزیع نرمال استاندارد (Normal PDF)
 */
export function normalPdf(x: number): number {
  return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

/**
 * محاسبه پارامترهای d1 و d2
 */
export function calculateD1D2(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number
): { d1: number; d2: number } {
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    return { d1: 0, d2: 0 };
  }
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return { d1, d2 };
}

/**
 * محاسبه قیمت تئوریک بلک-شولز
 */
export function blackScholesPrice(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: OptionType
): number {
  if (T <= 0) {
    return type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
  }

  const { d1, d2 } = calculateD1D2(S, K, T, r, sigma);

  if (type === 'call') {
    return Math.max(0, S * normalCdf(d1) - K * Math.exp(-r * T) * normalCdf(d2));
  } else {
    return Math.max(0, K * Math.exp(-r * T) * normalCdf(-d2) - S * normalCdf(-d1));
  }
}

/**
 * محاسبه حساسیت‌ها (یونانی‌ها: دلتا، گاما، تتا، وگا، رو)
 */
export function calculateOptionGreeks(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: OptionType
) {
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    const intrinsic = type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
    return {
      delta: type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
      theoreticalPrice: intrinsic,
    };
  }

  const { d1, d2 } = calculateD1D2(S, K, T, r, sigma);
  const sqrtT = Math.sqrt(T);
  const pdfD1 = normalPdf(d1);
  const expRT = Math.exp(-r * T);

  const gamma = pdfD1 / (S * sigma * sqrtT);
  const vega = (S * pdfD1 * sqrtT) / 100; // تغییر به ازای ۱٪ نوسان

  let delta: number;
  let theta: number;
  let rho: number;
  let price: number;

  if (type === 'call') {
    delta = normalCdf(d1);
    theta = (-(S * pdfD1 * sigma) / (2 * sqrtT) - r * K * expRT * normalCdf(d2)) / 365;
    rho = (K * T * expRT * normalCdf(d2)) / 100;
    price = S * delta - K * expRT * normalCdf(d2);
  } else {
    delta = normalCdf(d1) - 1;
    theta = (-(S * pdfD1 * sigma) / (2 * sqrtT) + r * K * expRT * normalCdf(-d2)) / 365;
    rho = (-K * T * expRT * normalCdf(-d2)) / 100;
    price = K * expRT * normalCdf(-d2) - S * normalCdf(-d1);
  }

  return {
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(6)),
    theta: Number(theta.toFixed(2)),
    vega: Number(vega.toFixed(2)),
    rho: Number(rho.toFixed(4)),
    theoreticalPrice: Math.round(price),
  };
}

/**
 * محاسبه نوسان‌پذیری ضمنی (IV) به روش نیوتن-رافسون با روش دوبخشی پشتیبان
 */
export function calculateImpliedVolatility(
  marketPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
  type: OptionType
): number {
  if (marketPrice <= 0 || T <= 0 || S <= 0 || K <= 0) return 0;

  const intrinsic = type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
  if (marketPrice < intrinsic) return 0.05;

  let vol = 0.35; // حدس اولیه ۳۵٪
  const maxIterations = 50;
  const tolerance = 0.001;

  for (let i = 0; i < maxIterations; i++) {
    const price = blackScholesPrice(S, K, T, r, vol, type);
    const diff = price - marketPrice;
    if (Math.abs(diff) < tolerance) {
      return Number(vol.toFixed(4));
    }

    const { d1 } = calculateD1D2(S, K, T, r, vol);
    const vega = S * normalPdf(d1) * Math.sqrt(T);

    if (vega < 1e-4) break;

    const step = diff / vega;
    vol -= step;

    if (vol <= 0.01 || vol >= 4.0) {
      // سوئیچ به روش دوبخشی (Bisection) در صورت ناپایداری
      let low = 0.01;
      let high = 3.5;
      for (let j = 0; j < 30; j++) {
        const mid = (low + high) / 2;
        const pMid = blackScholesPrice(S, K, T, r, mid, type);
        if (Math.abs(pMid - marketPrice) < tolerance) return Number(mid.toFixed(4));
        if (pMid < marketPrice) low = mid;
        else high = mid;
      }
      return Number(((low + high) / 2).toFixed(4));
    }
  }

  return Number(Math.max(0.05, Math.min(3.5, vol)).toFixed(4));
}

/**
 * وضعیت سودآوری قرارداد (Moneyness)
 */
export function getMoneyness(S: number, K: number, type: OptionType): Moneyness {
  const diffPct = Math.abs(S - K) / K;
  if (diffPct <= 0.015) return 'ATM';
  if (type === 'call') {
    return S > K ? 'ITM' : 'OTM';
  } else {
    return S < K ? 'ITM' : 'OTM';
  }
}

/**
 * محاسبه منحنی سود و زیان (Payoff) در تاریخ سررسید برای ترکیب پوزیشن‌ها
 */
export function calculatePayoff(
  legs: StrategyLeg[],
  spotPrice: number,
  rangePct: number = 0.35,
  steps: number = 80
): PayoffCalculation {
  if (!legs || legs.length === 0) {
    return {
      prices: [],
      pnl: [],
      breakEvens: [],
      maxProfit: 0,
      maxLoss: 0,
      netDebitCredit: 0,
      totalDelta: 0,
      totalGamma: 0,
      totalTheta: 0,
      totalVega: 0,
    };
  }

  const minPrice = Math.max(1, Math.round(spotPrice * (1 - rangePct)));
  const maxPrice = Math.round(spotPrice * (1 + rangePct));
  const stepSize = (maxPrice - minPrice) / (steps - 1);

  const prices: number[] = [];
  const pnl: number[] = [];

  let netDebitCredit = 0;
  let totalDelta = 0;
  let totalGamma = 0;
  let totalTheta = 0;
  let totalVega = 0;

  // محاسبه هزینه اولیه و یونانی‌های کل
  for (const leg of legs) {
    const size = leg.contractSize || 1000;
    const direction = leg.action === 'buy' ? 1 : -1;
    netDebitCredit += direction * leg.premium * leg.quantity * size;

    if (leg.type === 'call' || leg.type === 'put') {
      const greeks = calculateOptionGreeks(spotPrice, leg.strike, 45 / 365, 0.3, 0.35, leg.type);
      totalDelta += direction * greeks.delta * leg.quantity;
      totalGamma += direction * greeks.gamma * leg.quantity;
      totalTheta += direction * greeks.theta * leg.quantity * size;
      totalVega += direction * greeks.vega * leg.quantity * size;
    } else if (leg.type === 'stock') {
      totalDelta += direction * 1.0 * leg.quantity;
    }
  }

  for (let i = 0; i < steps; i++) {
    const curPrice = Math.round(minPrice + i * stepSize);
    prices.push(curPrice);

    let currentPnl = 0;

    for (const leg of legs) {
      const size = leg.contractSize || 1000;
      const direction = leg.action === 'buy' ? 1 : -1;

      if (leg.type === 'call') {
        const intrinsicAtExpiry = Math.max(0, curPrice - leg.strike);
        const legPnlPerShare = direction * (intrinsicAtExpiry - leg.premium);
        currentPnl += legPnlPerShare * leg.quantity * size;
      } else if (leg.type === 'put') {
        const intrinsicAtExpiry = Math.max(0, leg.strike - curPrice);
        const legPnlPerShare = direction * (intrinsicAtExpiry - leg.premium);
        currentPnl += legPnlPerShare * leg.quantity * size;
      } else if (leg.type === 'stock') {
        const legPnlPerShare = direction * (curPrice - leg.strike);
        currentPnl += legPnlPerShare * leg.quantity * size;
      }
    }

    pnl.push(Math.round(currentPnl));
  }

  // یافتن نقاط سر‌به‌سر (Break-evens)
  const breakEvens: number[] = [];
  for (let i = 0; i < pnl.length - 1; i++) {
    if ((pnl[i] <= 0 && pnl[i + 1] >= 0) || (pnl[i] >= 0 && pnl[i + 1] <= 0)) {
      const x1 = prices[i];
      const x2 = prices[i + 1];
      const y1 = pnl[i];
      const y2 = pnl[i + 1];
      if (y2 !== y1) {
        const xBe = Math.round(x1 - (y1 * (x2 - x1)) / (y2 - y1));
        if (!breakEvens.includes(xBe)) {
          breakEvens.push(xBe);
        }
      }
    }
  }

  const rawMax = Math.max(...pnl);
  const rawMin = Math.min(...pnl);

  // بررسی صعودی یا نزولی بودن بی‌نهایت
  const lastSlope = pnl[pnl.length - 1] - pnl[pnl.length - 2];
  const firstSlope = pnl[0] - pnl[1];

  let maxProfit: number | string = rawMax;
  let maxLoss: number | string = rawMin;

  if (lastSlope > 100 || firstSlope > 100) {
    maxProfit = 'نامحدود';
  }
  if (lastSlope < -100 || firstSlope < -100) {
    maxLoss = 'نامحدود';
  }

  return {
    prices,
    pnl,
    breakEvens,
    maxProfit,
    maxLoss,
    netDebitCredit,
    totalDelta: Number(totalDelta.toFixed(3)),
    totalGamma: Number(totalGamma.toFixed(5)),
    totalTheta: Math.round(totalTheta),
    totalVega: Math.round(totalVega),
  };
}

/**
 * فرمت‌بندی اعداد به ریال / تومان و ارقام فارسی یا لاتین
 */
export function formatRials(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '۰';
  return Math.round(val).toLocaleString('fa-IR');
}

export function formatToman(rials: number): string {
  if (rials === undefined || rials === null || isNaN(rials)) return '۰';
  const toman = Math.round(rials / 10);
  return toman.toLocaleString('fa-IR');
}

export function formatNumber(val: number, decimals: number = 0): string {
  if (val === undefined || val === null || isNaN(val)) return '۰';
  return Number(val.toFixed(decimals)).toLocaleString('fa-IR');
}
