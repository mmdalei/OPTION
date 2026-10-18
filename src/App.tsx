/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OptionChain } from './components/OptionChain';
import { PayoffCalculator } from './components/PayoffCalculator';
import { BlackScholesLab } from './components/BlackScholesLab';
import { MarketScanner } from './components/MarketScanner';
import { BackendCodeHub } from './components/BackendCodeHub';
import { Footer } from './components/Footer';
import { OptionContract, StrategyLeg } from './types/options';
import { Check, ArrowLeft } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chain' | 'payoff' | 'scanner' | 'lab' | 'backend'>('chain');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [strategyLegs, setStrategyLegs] = useState<StrategyLeg[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // افزودن قرارداد انتخابی به استراتژی Payoff
  const handleAddToStrategy = (contract: OptionContract, action: 'buy' | 'sell') => {
    const newLeg: StrategyLeg = {
      id: `leg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      symbol: contract.symbol,
      type: contract.type,
      action: action,
      strike: contract.strikePrice,
      premium: contract.lastPrice,
      quantity: 1,
      contractSize: contract.contractSize || 1000,
    };

    setStrategyLegs((prev) => [...prev, newLeg]);
    showToast(`نماد ${contract.symbol} (${action === 'buy' ? 'خرید' : 'فروش'}) به سبد استراتژی اضافه شد.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 bg-emerald-900 border border-emerald-600/80 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Check className="w-4 h-4 text-emerald-300" />
            <span className="text-xs font-medium">{toastMessage}</span>
            <button
              onClick={() => setActiveTab('payoff')}
              className="text-xs font-bold underline mr-2 text-emerald-200 hover:text-white cursor-pointer"
            >
              مشاهده در Payoff
            </button>
          </div>
        )}

        {/* Dynamic Views */}
        {activeTab === 'chain' && (
          <OptionChain
            onAddToStrategy={handleAddToStrategy}
            onNavigateToPayoff={() => setActiveTab('payoff')}
          />
        )}

        {activeTab === 'payoff' && (
          <PayoffCalculator
            initialLegs={strategyLegs.length > 0 ? strategyLegs : undefined}
          />
        )}

        {activeTab === 'scanner' && (
          <MarketScanner onAddToStrategy={handleAddToStrategy} />
        )}

        {activeTab === 'lab' && <BlackScholesLab />}

        {activeTab === 'backend' && <BackendCodeHub />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
