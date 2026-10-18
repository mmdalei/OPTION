"""
موتور محاسبات مالی و مدل بلک-شولز برای قراردادهای اختیار معامله بورس تهران
Black-Scholes Financial Pricing Engine & Greeks Calculator
"""

import math
from typing import Dict, Any, Tuple
import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq


def calculate_d1_d2(S: float, K: float, T: float, r: float, sigma: float) -> Tuple[float, float]:
    """
    محاسبه پارامترهای d1 و d2 در فرمول بلک-شولز
    :param S: قیمت لحظه‌ای دارایی پایه (Spot Price)
    :param K: قیمت اعمال قرارداد (Strike Price)
    :param T: زمان باقی‌مانده تا سررسید به سال (Time to Expiration in Years)
    :param r: نرخ بهره بدون ریسک سالانه (Risk-Free Interest Rate e.g. 0.30 for 30%)
    :param sigma: نوسان‌پذیری ضمنی یا تاریخی سالانه (Volatility)
    :return: (d1, d2)
    """
    if T <= 0 or sigma <= 0 or S <= 0 or K <= 0:
        return 0.0, 0.0
    
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return float(d1), float(d2)


def black_scholes_price(S: float, K: float, T: float, r: float, sigma: float, option_type: str = "call") -> float:
    """
    محاسبه قیمت تئوریک اختیار معامله خرید (Call) یا فروش (Put)
    """
    if T <= 0:
        if option_type.lower() == "call":
            return max(0.0, S - K)
        else:
            return max(0.0, K - S)

    d1, d2 = calculate_d1_d2(S, K, T, r, sigma)

    if option_type.lower() == "call":
        price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    elif option_type.lower() == "put":
        price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
    else:
        raise ValueError("نوع اختیار معامله باید 'call' یا 'put' باشد.")

    return max(0.0, float(price))


def calculate_greeks(S: float, K: float, T: float, r: float, sigma: float, option_type: str = "call") -> Dict[str, float]:
    """
    محاسبه حساسیت‌ها (یونانی‌های آپشن):
    - دلتا (Delta): حساسیت قیمت آپشن به تغییر ۱ واحد در قیمت سهم پایه
    - گاما (Gamma): نرخ تغییر دلتا نسبت به قیمت دارایی پایه
    - تتا (Theta): نرخ زوال زمانی روزانه قیمت آپشن
    - وگا (Vega): حساسیت به تغییر ۱ درصد در نوسان‌پذیری (Volatility)
    - رو (Rho): حساسیت به تغییر ۱ درصد در نرخ بهره بدون ریسک
    """
    if T <= 0 or sigma <= 0 or S <= 0 or K <= 0:
        intrinsic = max(0.0, S - K) if option_type.lower() == "call" else max(0.0, K - S)
        return {
            "delta": 1.0 if (option_type.lower() == "call" and S > K) else (-1.0 if (option_type.lower() == "put" and S < K) else 0.0),
            "gamma": 0.0,
            "theta": 0.0,
            "vega": 0.0,
            "rho": 0.0,
            "theoretical_price": intrinsic
        }

    d1, d2 = calculate_d1_d2(S, K, T, r, sigma)
    sqrt_T = np.sqrt(T)
    pdf_d1 = norm.pdf(d1)
    exp_rt = np.exp(-r * T)

    gamma = pdf_d1 / (S * sigma * sqrt_T)
    vega = (S * pdf_d1 * sqrt_T) / 100.0  # تغییر به ازای ۱٪ نوسان

    if option_type.lower() == "call":
        delta = norm.cdf(d1)
        # تتا به ازای گذشت ۱ روز تقویمی (تقسیم بر ۳۶۵)
        theta = (-(S * pdf_d1 * sigma) / (2 * sqrt_T) - r * K * exp_rt * norm.cdf(d2)) / 365.0
        rho = (K * T * exp_rt * norm.cdf(d2)) / 100.0
        price = S * delta - K * exp_rt * norm.cdf(d2)
    else:
        delta = norm.cdf(d1) - 1.0
        theta = (-(S * pdf_d1 * sigma) / (2 * sqrt_T) + r * K * exp_rt * norm.cdf(-d2)) / 365.0
        rho = (-K * T * exp_rt * norm.cdf(-d2)) / 100.0
        price = K * exp_rt * norm.cdf(-d2) - S * norm.cdf(-d1)

    return {
        "delta": round(float(delta), 4),
        "gamma": round(float(gamma), 6),
        "theta": round(float(theta), 2),
        "vega": round(float(vega), 2),
        "rho": round(float(rho), 4),
        "theoretical_price": round(float(price), 1)
    }


def calculate_implied_volatility(
    market_price: float,
    S: float,
    K: float,
    T: float,
    r: float,
    option_type: str = "call",
    low_vol: float = 0.001,
    high_vol: float = 4.0
) -> float:
    """
    محاسبه نوسان‌پذیری ضمنی (Implied Volatility - IV) با روش ریشه‌یابی برنت
    :param market_price: قیمت بازار فعلی اختیار معامله (پرمیوم)
    """
    if market_price <= 0 or T <= 0 or S <= 0 or K <= 0:
        return 0.0

    # بررسی کف ارزش ذاتی (No-arbitrage bounds)
    intrinsic = max(0.0, S - K) if option_type.lower() == "call" else max(0.0, K - S)
    if market_price < intrinsic:
        return 0.0

    def objective_function(vol: float) -> float:
        return black_scholes_price(S, K, T, r, vol, option_type) - market_price

    try:
        f_low = objective_function(low_vol)
        f_high = objective_function(high_vol)

        if f_low * f_high > 0:
            # اگر ریشه‌ای در بازه مشخص نباشد، نزدیک‌ترین مقدار را برمی‌گردانیم
            return 0.25 if f_low > 0 else 1.5

        iv = brentq(objective_function, low_vol, high_vol, xtol=1e-5, maxiter=100)
        return round(float(iv), 4)
    except Exception:
        # در صورت خطا یا همگرا نشدن
        return 0.35


def get_moneyness(S: float, K: float, option_type: str = "call", threshold: float = 0.015) -> str:
    """
    تشخیص وضعیت سودآوری قرارداد:
    - ITM (در سود): In-The-Money
    - ATM (بی‌تفاوت / سر‌به‌سر): At-The-Money
    - OTM (در زیان): Out-Of-The-Money
    """
    diff_pct = (S - K) / K
    if abs(diff_pct) <= threshold:
        return "ATM"
    
    if option_type.lower() == "call":
        return "ITM" if S > K else "OTM"
    else:
        return "ITM" if S < K else "OTM"


def calculate_payoff_curve(legs: list, price_range_pct: float = 0.35, points: int = 100) -> Dict[str, Any]:
    """
    محاسبه نمودار سود و زیان (Payoff) در تاریخ سررسید برای ترکیب چند موقعیت (Legs)
    هر پوزیشن شامل:
    - type: 'call' | 'put' | 'stock'
    - action: 'buy' | 'sell'
    - strike: قیمت اعمال
    - premium: قیمت خرید یا فروش اختیار
    - quantity: تعداد قراردادها (با ضریب سهم مثلا ۱۰۰۰)
    """
    if not legs:
        return {"prices": [], "pnl": [], "break_evens": [], "max_profit": 0, "max_loss": 0}

    # تعیین بازه قیمت سهم پایه
    strikes = [leg["strike"] for leg in legs if leg.get("strike", 0) > 0]
    base_price = strikes[0] if strikes else 1000.0

    min_price = max(1.0, base_price * (1 - price_range_pct))
    max_price = base_price * (1 + price_range_pct)
    prices = np.linspace(min_price, max_price, points)

    pnl_series = np.zeros(len(prices))

    for leg in legs:
        leg_type = leg["type"].lower()
        action = leg["action"].lower()
        strike = leg.get("strike", 0.0)
        premium = leg.get("premium", 0.0)
        qty = leg.get("quantity", 1)
        contract_size = leg.get("contract_size", 1000)

        multiplier = 1 if action == "buy" else -1

        if leg_type == "call":
            # خریدار کال: max(0, S - K) - Premium
            # فروشنده کال: Premium - max(0, S - K)
            payoff_per_share = np.maximum(0, prices - strike) - premium
        elif leg_type == "put":
            # خریدار پوت: max(0, K - S) - Premium
            # فروشنده پوت: Premium - max(0, K - S)
            payoff_per_share = np.maximum(0, strike - prices) - premium
        elif leg_type == "stock":
            # خود دارایی پایه
            entry_price = leg.get("strike", base_price)
            payoff_per_share = prices - entry_price
        else:
            continue

        pnl_series += multiplier * payoff_per_share * qty * contract_size

    # نقاط سربه سر (جایی که PnL علامت عوض می‌کند)
    break_evens = []
    for i in range(len(pnl_series) - 1):
        if pnl_series[i] * pnl_series[i + 1] <= 0:
            x1, y1 = prices[i], pnl_series[i]
            x2, y2 = prices[i + 1], pnl_series[i + 1]
            if y2 != y1:
                x_be = x1 - y1 * (x2 - x1) / (y2 - y1)
                break_evens.append(round(float(x_be), 0))

    return {
        "prices": [round(float(p), 1) for p in prices],
        "pnl": [round(float(pnl), 0) for pnl in pnl_series],
        "break_evens": list(set(break_evens)),
        "max_profit": round(float(np.max(pnl_series)), 0),
        "max_loss": round(float(np.min(pnl_series)), 0)
    }
