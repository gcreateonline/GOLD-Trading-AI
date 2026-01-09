import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Candle, TradingSettings, OrderBlock, FVG, SignalType } from '../types';

interface MarketMatrixProps {
  candles: Candle[];
  indicators: any;
  settings: TradingSettings;
}

const MarketMatrix: React.FC<MarketMatrixProps> = ({ candles, indicators, settings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentPrice = candles[candles.length - 1]?.close || 2500;
  const lastCandle = candles[candles.length - 1];
  const { signal, entry, sl, tp1, tp2, isBETriggered, beLevel } = indicators.confluence;
  
  // Create a range of prices around the current price for the ladder
  const priceStep = useMemo(() => {
    const range = (Math.max(...candles.map(c => c.high)) - Math.min(...candles.map(c => c.low)));
    return Math.max(0.01, Math.round((range / 40) * 100) / 100);
  }, [candles]);

  const ladderLevels = useMemo(() => {
    const levels = [];
    const steps = 40; // More steps for better coverage of TPs/SLs
    // Anchor to current price or entry if active
    const anchor = (signal !== SignalType.NONE && entry) ? entry : currentPrice;
    for (let i = steps; i >= -steps; i--) {
      levels.push(anchor + (i * priceStep));
    }
    return levels;
  }, [currentPrice, priceStep, signal, entry]);

  // Auto-scroll to center on current price or entry
  useEffect(() => {
    if (containerRef.current) {
      const center = containerRef.current.scrollHeight / 2 - containerRef.current.clientHeight / 2;
      containerRef.current.scrollTo({ top: center, behavior: 'smooth' });
    }
  }, [settings.asset, signal]);

  const getZone = (price: number) => {
    const ob = indicators.orderBlocks.find((o: OrderBlock) => price <= o.top && price >= o.bottom);
    const fvg = indicators.fvgs.find((f: FVG) => price <= f.top && price >= f.bottom);
    return { ob, fvg };
  };

  const getSignalMarker = (price: number) => {
    const threshold = priceStep / 2;
    if (signal === SignalType.NONE) return null;
    
    if (Math.abs(price - entry!) < threshold) return { type: 'ENTRY', color: 'bg-blue-500', label: 'ENTRY' };
    if (Math.abs(price - sl!) < threshold) return { type: 'SL', color: 'bg-red-500', label: 'STOP LOSS' };
    if (Math.abs(price - tp1!) < threshold) return { type: 'TP1', color: 'bg-green-500', label: 'TP 1' };
    if (Math.abs(price - tp2!) < threshold) return { type: 'TP2', color: 'bg-emerald-500', label: 'TP 2 (MAX)' };
    if (isBETriggered && beLevel && Math.abs(price - beLevel) < threshold) return { type: 'BE', color: 'bg-white', label: 'BREAKEVEN' };
    
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0e12] overflow-hidden">
      {/* Top Bar Info */}
      <div className="h-12 border-b border-zinc-800 flex items-center px-6 gap-6 bg-[#13141b]/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Market Matrix</span>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
        
        {signal !== SignalType.NONE && (
          <>
            <div className="h-4 w-[1px] bg-zinc-800"></div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${signal === SignalType.BUY ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase">{signal} SIGNAL ACTIVE</span>
              <div className={`w-1.5 h-1.5 rounded-full animate-ping ${signal === SignalType.BUY ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-4 text-[11px] font-mono">
          <span className="text-zinc-500">VOL: <span className="text-zinc-300">{(lastCandle?.volume || 0).toLocaleString()}</span></span>
          <span className="text-zinc-500">ATR: <span className="text-zinc-300">{(lastCandle?.high - lastCandle?.low).toFixed(2)}</span></span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* The Price Ladder */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto no-scrollbar scroll-smooth border-r border-zinc-800"
        >
          <div className="min-w-full">
            {ladderLevels.map((level, idx) => {
              const { ob, fvg } = getZone(level);
              const isNearCurrent = Math.abs(level - currentPrice) < (priceStep / 2);
              const marker = getSignalMarker(level);
              
              return (
                <div 
                  key={idx}
                  className={`group h-10 border-b border-zinc-900/50 flex items-center px-4 transition-all hover:bg-zinc-800/20 
                    ${isNearCurrent ? 'bg-blue-500/5 border-blue-500/20' : ''} 
                    ${marker ? 'bg-white/5' : ''}`}
                >
                  {/* Institutional Zones Column */}
                  <div className="w-48 flex items-center gap-2">
                    {ob && (
                      <div className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-tighter ${ob.type === 'BULLISH' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]'}`}>
                        OB {ob.type}
                      </div>
                    )}
                    {fvg && (
                      <div className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-tighter ${fvg.type === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                        FVG {fvg.type}
                      </div>
                    )}
                  </div>

                  {/* Price Column */}
                  <div className={`w-32 font-mono text-sm font-bold transition-all ${isNearCurrent ? 'text-blue-400 scale-110' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    {level.toFixed(2)}
                  </div>

                  {/* Signal Indicators Column */}
                  <div className="w-48 flex items-center">
                    {marker && (
                      <div className={`flex items-center gap-2 animate-in slide-in-from-left-2 duration-300`}>
                        <div className={`w-2 h-2 rounded-full ${marker.color} shadow-[0_0_8px_rgba(255,255,255,0.2)]`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${marker.color.replace('bg-', 'text-')}`}>
                          {marker.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Volume/Activity Profile */}
                  <div className="flex-1 flex items-center gap-1 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${isNearCurrent ? 'bg-blue-500' : 'bg-zinc-800 group-hover:bg-zinc-700'}`}
                      style={{ width: `${Math.random() * 60 + 5}%` }}
                    />
                    {isNearCurrent && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                        <span className="text-[9px] font-black text-blue-500 uppercase">Live Tick</span>
                      </div>
                    )}
                  </div>

                  {/* Liquidity/Sweeps */}
                  <div className="w-24 flex justify-end">
                    {Math.random() > 0.97 && (
                      <div className="flex items-center gap-1 group-hover:scale-110 transition-transform">
                        <span className="text-xs">💧</span>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Liquidity</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Narrative Tape */}
        <div className="w-80 bg-[#13141b]/30 flex flex-col p-6">
           <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
             <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
             Institutional Tape
           </h3>
           <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {Array.from({ length: 8 }).map((_, i) => {
                const isSignalRelated = signal !== SignalType.NONE && i === 0;
                return (
                  <div key={i} className={`flex flex-col gap-1 p-3 rounded border transition-colors cursor-default 
                    ${isSignalRelated ? 'bg-blue-500/10 border-blue-500/30' : 'bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-bold uppercase ${isSignalRelated ? 'text-blue-400' : Math.random() > 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isSignalRelated ? `${signal} SIGNAL TRIGGERED` : Math.random() > 0.5 ? 'Institutional Buy' : 'Liquidity Sweep'}
                      </span>
                      <span className="text-[8px] font-mono text-zinc-600">
                        {new Date(Date.now() - (i * 120000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-medium">
                      {isSignalRelated ? `Confluence requirements met at ${entry?.toFixed(2)}. Targets set.` : Math.random() > 0.5 ? 'Aggressive buying detected at discount zone.' : 'Retail stops hunted below recent swing low.'}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">
                      VOL: {(Math.random() * 100).toFixed(2)}K
                    </div>
                  </div>
                );
              })}
           </div>

           {/* Live HUD at bottom of matrix */}
           <div className="mt-6 pt-6 border-t border-zinc-800 space-y-4">
              <div className="flex justify-between items-end">
                 <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Spread</span>
                    <span className="text-xs font-mono text-zinc-300">0.08 Pips</span>
                 </div>
                 <div className="text-right">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Est. Liquidity</span>
                    <span className="text-xs font-mono text-blue-400 font-bold">$14.2M</span>
                 </div>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 w-3/4 animate-pulse"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MarketMatrix;