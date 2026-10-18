/**
 * تایپ‌ها و ساختار داده‌های سامانه تحلیل اختیار معامله بورس تهران
 */

export type OptionType = 'call' | 'put';
export type Moneyness = 'ITM' | 'ATM' | 'OTM';
export type LegAction = 'buy' | 'sell';
export type LegType = 'call' | 'put' | 'stock';

export interface UnderlyingAsset {
  symbol: string;
  name: string;
  price: number; // قیمت پایانی به ریال
  change: number; // تغییر ریالی
  changePct: number; // درصد تغییر
  volume: number; // حجم معاملات سهام
  valueBillion: number; // ارزش معاملات میلیارد ریال
  historicalVol: number; // نوسان تاریخی سالانه (مثلا ۰.۳۵)
  high: number;
  low: number;
  totalOptionVolume: number;
  totalOptionValue: number;
}

export interface ExpirationDate {
  date: string; // مثال: "1405/02/28"
  daysToExpiration: number; // DTE
  label: string; // مثال: "اردیبهشت ۱۴۰۵"
}

export interface OrderBookRow {
  bidVolume: number;
  bidPrice: number;
  askPrice: number;
  askVolume: number;
}

export interface OptionContract {
  symbol: string; // مثلا "ضخود۱۲۱۰"
  underlyingSymbol: string; // "خودرو"
  type: OptionType;
  strikePrice: number; // قیمت اعمال
  expirationDate: string; // تاریخ سررسید
  daysToExpiration: number;
  lastPrice: number; // آخرین قیمت معامله (پرمیوم) به ریال
  yesterdayPrice: number;
  changePct: number;
  volume: number; // تعداد قرارداد معامله شده
  tradesCount: number;
  valueRials: number; // ارزش معاملات
  openInterest: number; // موقعیت‌های باز
  openInterestChange: number; // تغییر موقعیت باز نسبت به روز قبل
  bidPrice: number;
  bidVolume: number;
  askPrice: number;
  askVolume: number;
  orderBook: OrderBookRow[];
  iv: number; // نوسان ضمنی (Implied Volatility)
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  theoreticalPrice: number;
  intrinsicValue: number; // ارزش ذاتی
  timeValue: number; // ارزش زمانی
  effectiveLeverage: number; // اهرم موثر
  moneyness: Moneyness;
  breakEvenPrice: number; // نقطه سر‌به‌سر قرارداد به تنهایی
  contractSize: number; // ضریب قرارداد (معمولا ۱۰۰۰ سهم)
}

export interface OptionChainRow {
  strikePrice: number;
  pctDiffFromSpot: number; // درصد فاصله قیمت اعمال از قیمت روز سهم پایه
  call: OptionContract;
  put: OptionContract;
}

export interface StrategyLeg {
  id: string;
  type: LegType;
  action: LegAction;
  symbol?: string;
  strike: number;
  premium: number; // قیمت خرید/فروش پرمیوم
  quantity: number; // تعداد قرارداد
  contractSize: number; // ضریب قرارداد (پیش‌فرض ۱۰۰۰)
}

export interface StrategyPreset {
  id: string;
  name: string;
  englishName: string;
  outlook: 'bullish' | 'bearish' | 'neutral' | 'high_volatility' | 'low_volatility';
  description: string;
  buildLegs: (spotPrice: number, strikeStep: number) => Omit<StrategyLeg, 'id'>[];
}

export interface PayoffCalculation {
  prices: number[];
  pnl: number[];
  breakEvens: number[];
  maxProfit: number | string;
  maxLoss: number | string;
  netDebitCredit: number; // مثبت: هزینه اولیه (Debit)، منفی: دریافت اعتبار (Credit)
  totalDelta: number;
  totalGamma: number;
  totalTheta: number;
  totalVega: number;
}
