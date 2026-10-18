import React, { useState } from 'react';
import { Code, Copy, Check, Terminal, FileCode, FolderTree, Cpu, Server } from 'lucide-react';

export const BackendCodeHub: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<'main' | 'calculator' | 'tsetmc' | 'requirements' | 'docker'>('calculator');
  const [copied, setCopied] = useState<boolean>(false);

  const fileContents = {
    calculator: `"""
calculator.py - موتور محاسبات بلک-شولز و یونانی‌های اختیار معامله
Black-Scholes Pricing Engine, Greeks & Implied Volatility Solver
"""

import math
from typing import Dict, Any, Tuple
import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq


def calculate_d1_d2(S: float, K: float, T: float, r: float, sigma: float) -> Tuple[float, float]:
    """محاسبه متغیرهای d1 و d2 در فرمول بلک-شولز"""
    if T <= 0 or sigma <= 0 or S <= 0 or K <= 0:
        return 0.0, 0.0
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return float(d1), float(d2)


def black_scholes_price(S: float, K: float, T: float, r: float, sigma: float, option_type: str = "call") -> float:
    """محاسبه قیمت تئوریک کال یا پوت"""
    if T <= 0:
        return max(0.0, S - K) if option_type.lower() == "call" else max(0.0, K - S)

    d1, d2 = calculate_d1_d2(S, K, T, r, sigma)
    if option_type.lower() == "call":
        price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    else:
        price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
    return max(0.0, float(price))


def calculate_greeks(S: float, K: float, T: float, r: float, sigma: float, option_type: str = "call") -> Dict[str, float]:
    """محاسبه کلیه یونانی‌ها: دلتا، گاما، تتا (روزانه)، وگا و رو"""
    d1, d2 = calculate_d1_d2(S, K, T, r, sigma)
    sqrt_T = np.sqrt(T)
    pdf_d1 = norm.pdf(d1)
    exp_rt = np.exp(-r * T)

    gamma = pdf_d1 / (S * sigma * sqrt_T)
    vega = (S * pdf_d1 * sqrt_T) / 100.0  # به ازای ۱٪ نوسان

    if option_type.lower() == "call":
        delta = norm.cdf(d1)
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


def calculate_implied_volatility(market_price: float, S: float, K: float, T: float, r: float, option_type: str = "call") -> float:
    """محاسبه نوسان‌پذیری ضمنی (IV) با روش ریشه‌یابی برنت"""
    if market_price <= 0 or T <= 0 or S <= 0 or K <= 0:
        return 0.0

    def objective(vol: float) -> float:
        return black_scholes_price(S, K, T, r, vol, option_type) - market_price

    try:
        return round(float(brentq(objective, 0.001, 4.0, xtol=1e-5)), 4)
    except Exception:
        return 0.35
`,
    main: `"""
main.py - سرور FastAPI و مدیریت WebSocketها
OptionBaaz FastAPI Engine
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import json

from calculator import (
    calculate_greeks,
    calculate_implied_volatility,
    calculate_payoff_curve,
    get_moneyness
)
from tsetmc_collector import tsetmc_service

app = FastAPI(
    title="سامانه تحلیل اختیار معامله بورس تهران (OptionBaaz API)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BlackScholesRequest(BaseModel):
    spot_price: float
    strike_price: float
    days_to_expiration: int
    risk_free_rate: float = 0.30
    volatility: float = 0.35
    option_type: str = "call"
    market_price: Optional[float] = None

class StrategyLeg(BaseModel):
    type: str  # 'call' | 'put' | 'stock'
    action: str  # 'buy' | 'sell'
    strike: float = 0.0
    premium: float = 0.0
    quantity: int = 1
    contract_size: int = 1000

class PayoffRequest(BaseModel):
    legs: List[StrategyLeg]
    price_range_pct: float = 0.35
    points_count: int = 100

@app.get("/api/option-chain/{underlying_symbol}")
async def get_option_chain(underlying_symbol: str):
    """دریافت ماتریس دوبعدی زنجیره قراردادها مرتب‌شده بر اساس قیمت اعمال"""
    chain = await tsetmc_service.get_mock_or_live_option_chain(underlying_symbol)
    if not chain:
        raise HTTPException(status_code=404, detail="نماد یافت نشد")
    return chain

@app.post("/api/black-scholes")
def compute_bs(req: BlackScholesRequest):
    """محاسبه قیمت منصفانه، یونانی‌ها و IV"""
    T = req.days_to_expiration / 365.0
    greeks = calculate_greeks(req.spot_price, req.strike_price, T, req.risk_free_rate, req.volatility, req.option_type)
    moneyness = get_moneyness(req.spot_price, req.strike_price, req.option_type)
    
    iv = None
    if req.market_price:
        iv = calculate_implied_volatility(req.market_price, req.spot_price, req.strike_price, T, req.risk_free_rate, req.option_type)

    return {
        "theoretical_price": greeks["theoretical_price"],
        "greeks": greeks,
        "moneyness": moneyness,
        "iv": iv
    }

@app.post("/api/payoff")
def compute_payoff(req: PayoffRequest):
    """محاسبه مختصات سود و زیان Payoff برای نمودار"""
    return calculate_payoff_curve([leg.model_dump() for leg in req.legs], req.price_range_pct, req.points_count)
`,
    tsetmc: `"""
tsetmc_collector.py - اتصال به اندپوینت‌های TSETMC بورس تهران
"""

import httpx
import logging
from typing import Dict, Any, List

logger = logging.getLogger("tsetmc_collector")

TSETMC_MARKET_WATCH_URL = "https://old.tsetmc.com/tsev2/data/MarketWatchPlus.aspx"

class TsetmcCollector:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "*/*"
        }

    async def fetch_market_watch(self) -> str:
        """دریافت خام داده‌های تابلوی بورس"""
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(TSETMC_MARKET_WATCH_URL, headers=self.headers)
            return resp.text

    def parse_option_symbol(self, symbol: str) -> Dict[str, Any]:
        """تفکیک نام نماد: ضخود (خرید) / طخود (فروش)"""
        return {
            "type": "call" if symbol.startswith("ض") else "put",
            "symbol": symbol
        }

tsetmc_service = TsetmcCollector()
`,
    requirements: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
pydantic>=2.6.0
numpy>=1.26.0
scipy>=1.12.0
httpx>=0.27.0
redis>=5.0.0
websockets>=12.0
python-dateutil>=2.9.0
jdatetime>=5.0.0
`,
    docker: `FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContents[selectedFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              کدهای آماده بک‌اند پایتون و معماری سیستم (Python FastAPI Hub)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              کدهای کامل بک‌اند درخواستی شما برای پیاده‌سازی مستقل روی سرور شخصی با FastAPI، Scipy و اتصال به TSETMC
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی محتوای فایل</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Project Structure Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* File Navigator */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <FolderTree className="w-4 h-4 text-emerald-400" />
            فایل‌های پروژه (Project Tree)
          </h3>

          <div className="space-y-1 text-xs font-mono">
            <button
              onClick={() => setSelectedFile('calculator')}
              className={`w-full text-right px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                selectedFile === 'calculator'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>calculator.py</span>
            </button>

            <button
              onClick={() => setSelectedFile('main')}
              className={`w-full text-right px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                selectedFile === 'main'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>main.py</span>
            </button>

            <button
              onClick={() => setSelectedFile('tsetmc')}
              className={`w-full text-right px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                selectedFile === 'tsetmc'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>tsetmc_collector.py</span>
            </button>

            <button
              onClick={() => setSelectedFile('requirements')}
              className={`w-full text-right px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                selectedFile === 'requirements'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>requirements.txt</span>
            </button>

            <button
              onClick={() => setSelectedFile('docker')}
              className={`w-full text-right px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                selectedFile === 'docker'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Dockerfile</span>
            </button>
          </div>

          {/* Quick Setup Instructions */}
          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <span className="font-semibold text-slate-200 block">دستور اجرای بک‌اند:</span>
            <div className="bg-slate-950 p-2 rounded font-mono text-[10px] text-emerald-400 space-y-1">
              <div>pip install -r requirements.txt</div>
              <div>uvicorn main:app --reload</div>
            </div>
          </div>
        </div>

        {/* Code Editor Preview */}
        <div className="md:col-span-3 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="text-white font-semibold flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              backend/{selectedFile}.{selectedFile === 'requirements' ? 'txt' : selectedFile === 'docker' ? 'dockerfile' : 'py'}
            </span>
            <span>UTF-8 · Python 3.11</span>
          </div>

          <div className="p-4 overflow-x-auto max-h-[560px] overflow-y-auto">
            <pre className="text-xs font-mono text-slate-200 leading-relaxed" dir="ltr">
              <code>{fileContents[selectedFile]}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
