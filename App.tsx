import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MarketMatrix from './components/MarketMatrix';
import Dashboard from './components/Dashboard';
import AIAssistant from './components/AIAssistant';
import { generateMockData } from './utils/mockData';
import { calculateIndicators } from './utils/indicatorLogic';
import { TradingSettings, Candle, ConfluenceState, LivePriceData } from './types';

const INITIAL_SETTINGS: TradingSettings = {
  requireOB: true,
  requireFVG: false,
  requireLiquidity: true,
  minConfluence: 2,
  riskReward: 2.5,
  slBuffer: 0.1,
  beThreshold: 0.5,
  showOB: true,
  showFVG: true,
  showStructure: true,
  asset: 'XAUUSD',
  timeframe: '15M'
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<TradingSettings>(INITIAL_SETTINGS);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [liveData, setLiveData] = useState<LivePriceData | null>(null);
  const livePriceRef = useRef<number | null>(null);
  
  const [confluence, setConfluence] = useState<ConfluenceState>({
    score: 0,
    hasOB: false,
    hasFVG: false,
    hasLiquidity: false,
    hasStructure: false,
    signal: 'NONE' as any,
    isBETriggered: false
  });

  // Load initial data
  useEffect(() => {
    const basePrice = liveData?.price || 2500.00;
    const data = generateMockData(100, basePrice, settings.timeframe);
    setCandles(data);
    if (!livePriceRef.current) livePriceRef.current = basePrice;
  }, [settings.asset, settings.timeframe]);

  // Live Refresh Logic
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setCandles(prev => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const lastIndex = next.length - 1;
        const lastCandle = next[lastIndex];
        
        const targetPrice = livePriceRef.current || lastCandle.close;
        const drift = (targetPrice - lastCandle.close) * 0.1;
        const volatility = targetPrice * 0.0001;
        const jitter = (Math.random() - 0.5) * volatility;
        const newClose = lastCandle.close + drift + jitter;
        
        next[lastIndex] = {
          ...lastCandle,
          close: newClose,
          high: Math.max(lastCandle.high, newClose),
          low: Math.min(lastCandle.low, newClose)
        };
        return next;
      });
    }, 2000);

    return () => clearInterval(refreshInterval);
  }, []);

  const handlePriceSync = useCallback((data: LivePriceData) => {
    setLiveData(data);
    livePriceRef.current = data.price;
    
    setCandles(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = {
        ...last,
        close: data.price,
        high: Math.max(last.high, data.price),
        low: Math.min(last.low, data.price)
      };
      return next;
    });
  }, []);

  const indicators = useMemo(() => {
    return calculateIndicators(candles, settings);
  }, [candles, settings]);

  useEffect(() => {
    setConfluence(indicators.confluence);
  }, [indicators]);

  return (
    <div className="flex h-screen bg-[#0d0e12] overflow-hidden text-zinc-100">
      <Sidebar settings={settings} onSettingsChange={setSettings} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#13141b]">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              <span className="text-blue-500">🎯</span> ICT CONFLUENCE
            </h1>
            <div className="h-4 w-[1px] bg-zinc-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{settings.asset}</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-blue-400">{settings.timeframe}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             {liveData && (
                <div className="flex items-center gap-3 pr-4 border-r border-zinc-800">
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Real-Time Sync</span>
                      <span className="text-xs text-blue-400 font-mono font-bold tracking-tight">
                         {candles[candles.length - 1]?.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                   </div>
                   <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-blue-500 animate-ping opacity-50"></div>
                   </div>
                </div>
             )}
             <div className="flex items-center gap-3">
               <div className="flex flex-col items-end">
                 <span className="text-[10px] text-zinc-500 uppercase font-bold">Market Status</span>
                 <span className="text-xs text-green-400 font-medium uppercase tracking-widest">Institutional Flow ON</span>
               </div>
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
             </div>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 bg-[#0d0e12]">
             <MarketMatrix 
               candles={candles} 
               indicators={indicators} 
               settings={settings}
             />
          </div>
          
          <div className="h-1/3 border-t border-zinc-800 flex flex-col lg:flex-row bg-[#13141b]">
            <Dashboard confluence={confluence} candles={candles} settings={settings} onPriceSync={handlePriceSync} />
            <AIAssistant candles={candles} confluence={confluence} settings={settings} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;