"""
سرور اصلی FastAPI - پلتفرم دیده‌بان و تحلیل اختیار معامله بورس تهران
Option Trading Platform Backend API & WebSocket Server
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import json

from calculator import (
    black_scholes_price,
    calculate_greeks,
    calculate_implied_volatility,
    calculate_payoff_curve,
    get_moneyness
)
from tsetmc_collector import tsetmc_service

app = FastAPI(
    title="سامانه تحلیل اختیار معامله بورس تهران (OptionBaaz API)",
    description="API جامع جهت دریافت زنجیره قراردادها، محاسبات بلک-شولز، یونانی‌ها و ماشین‌حساب استراتژی‌های Payoff",
    version="1.0.0"
)

# فعال‌سازی CORS برای ارتباط امن فرانت‌اند
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== مدل‌های اعتبارسنجی (Pydantic Models) ====================

class BlackScholesRequest(BaseModel):
    spot_price: float = Field(..., description="قیمت دارایی پایه (S) به ریال")
    strike_price: float = Field(..., description="قیمت اعمال قرارداد (K) به ریال")
    days_to_expiration: int = Field(..., ge=1, description="روزهای باقی‌مانده تا سررسید (DTE)")
    risk_free_rate: float = Field(0.30, ge=0.0, le=1.0, description="نرخ بهره بدون ریسک سالانه (مثلا ۰.۳۰ برای ۳۰٪)")
    volatility: float = Field(0.35, ge=0.01, le=5.0, description="نوسان‌پذیری سالانه دارایی (سیگما)")
    option_type: str = Field("call", description="'call' یا 'put'")
    market_price: Optional[float] = Field(None, description="قیمت معامله در بازار (برای محاسبه IV)")


class StrategyLeg(BaseModel):
    type: str = Field(..., description="'call' | 'put' | 'stock'")
    action: str = Field(..., description="'buy' (خرید) یا 'sell' (فروش)")
    strike: float = Field(0.0, description="قیمت اعمال قرارداد")
    premium: float = Field(0.0, description="پرمیوم یا قیمت خرید/فروش")
    quantity: int = Field(1, ge=1, description="تعداد قراردادها")
    contract_size: int = Field(1000, description="اندازه هر قرارداد (پیش‌فرض ۱۰۰۰ سهم)")


class PayoffRequest(BaseModel):
    legs: List[StrategyLeg]
    price_range_pct: float = Field(0.35, ge=0.05, le=1.0, description="بازه نوسان قیمت سهم پایه برای رسم نمودار")
    points_count: int = Field(100, ge=20, le=500, description="تعداد نقاط روی محور مختصات")


# ==================== اندپوینت‌های REST API ====================

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Tehran Option Trading Engine",
        "market": "Tehran Stock Exchange (TSETMC)",
        "docs": "/docs"
    }


@app.get("/api/option-chain/{underlying_symbol}")
async def get_option_chain(underlying_symbol: str):
    """
    دریافت زنجیره قراردادهای اختیار معامله (Option Chain) مرتب‌شده بر اساس سررسید و قیمت اعمال
    """
    chain_data = await tsetmc_service.get_mock_or_live_option_chain(underlying_symbol)
    if not chain_data:
        raise HTTPException(status_code=404, detail="اطلاعات نماد مورد نظر یافت نشد.")
    return chain_data


@app.post("/api/black-scholes")
def compute_black_scholes(req: BlackScholesRequest):
    """
    محاسبه قیمت تئوریک، یونانی‌ها (Delta, Gamma, Theta, Vega, Rho) و نوسان ضمنی (IV)
    """
    T = req.days_to_expiration / 365.0
    greeks = calculate_greeks(
        S=req.spot_price,
        K=req.strike_price,
        T=T,
        r=req.risk_free_rate,
        sigma=req.volatility,
        option_type=req.option_type
    )

    moneyness = get_moneyness(req.spot_price, req.strike_price, req.option_type)

    iv = None
    if req.market_price is not None and req.market_price > 0:
        iv = calculate_implied_volatility(
            market_price=req.market_price,
            S=req.spot_price,
            K=req.strike_price,
            T=T,
            r=req.risk_free_rate,
            option_type=req.option_type
        )

    # اهرم موثر: اهرم = دلتا * (قیمت پایه / قیمت آپشن)
    leverage = 0.0
    price_for_leverage = req.market_price if (req.market_price and req.market_price > 0) else greeks["theoretical_price"]
    if price_for_leverage > 0:
        leverage = round(abs(greeks["delta"]) * (req.spot_price / price_for_leverage), 2)

    return {
        "theoretical_price": greeks["theoretical_price"],
        "greeks": greeks,
        "moneyness": moneyness,
        "implied_volatility": iv,
        "effective_leverage": leverage
    }


@app.post("/api/payoff")
def compute_payoff(req: PayoffRequest):
    """
    محاسبه منحنی سود و زیان (Payoff) استراتژی‌های ترکیبی و یافتن نقاط سر‌به‌سر
    """
    legs_dicts = [leg.model_dump() for leg in req.legs]
    result = calculate_payoff_curve(
        legs=legs_dicts,
        price_range_pct=req.price_range_pct,
        points=req.points_count
    )
    return result


@app.get("/api/market-summary")
async def get_market_summary():
    """
    خلاصه کلی بازار مشتقات بورس تهران (نسبت P/C، حجم کل، برترین‌ها)
    """
    return {
        "market_status": "open",
        "market_time": "12:30:00",
        "put_call_volume_ratio": 0.68,
        "put_call_oi_ratio": 0.82,
        "total_contracts_traded": 48200000,
        "total_turnover_billion_rials": 1420.5,
        "top_volume_underlyings": [
            {"symbol": "اهرم", "volume_share": "38%"},
            {"symbol": "خودرو", "volume_share": "24%"},
            {"symbol": "طلا", "volume_share": "16%"},
            {"symbol": "فملی", "volume_share": "12%"},
        ]
    }


# ==================== وب‌سوکت برای آپدیت لحظه‌ای ====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_text(json.dumps(message, ensure_ascii=False))


manager = ConnectionManager()


@app.websocket("/ws/live-quotes")
async def websocket_quotes_endpoint(websocket: WebSocket):
    """
    استریم زنده تغییرات قیمتی مظنه‌ها و معاملات اختیارها
    """
    await manager.connect(websocket)
    try:
        while True:
            # ارسال تیک‌های شبیه‌سازی‌شده لحظه‌ای به کلاینت‌ها هر ۲ ثانیه
            await asyncio.sleep(2.0)
            tick_update = {
                "type": "TICK",
                "symbol": "ضخود۱۲۱۰",
                "last_price": 245,
                "volume": 1250000,
                "bid": 240,
                "ask": 246
            }
            await websocket.send_text(json.dumps(tick_update, ensure_ascii=False))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
