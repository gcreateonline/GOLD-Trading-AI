
import React from 'react';
import { ConfluenceState, Candle, TradingSettings, LivePriceData } from '../types';
import LiveMarketPulse from './LiveMarketPulse';

interface DashboardProps {
  confluence: ConfluenceState;
  candles: Candle[];
  settings: TradingSettings;
  onPriceSync?: (data: LivePriceData) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ confluence, candles, settings, onPriceSync }) => {
  const getScoreColor = (score: number) => {
    if (score >= 3) return 'text-green-400';
    if (score >= 2) return 'text-blue-400';
    return 'text-zinc-500';
  };

  return (
    <div className="w-full lg:w-1/2 p-6 flex border-r border-zinc-800">
      <div className="flex-1 flex flex-col justify-center border-r border-zinc-800 pr-8">
         <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Technical Confluence</span>
            {confluence.isBETriggered && (
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center gap-1 border border-blue-500/30">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                PROTECTED
              </span>
            )}
         </div>
         <div className="flex items-end gap-3 mb-2">
            <span className={`text-6xl font-black ${getScoreColor(confluence.score)}`}>{confluence.score}</span>
            <span className="text-2xl font-bold text-zinc-700 pb-1">/ 4</span>
         </div>
         <p className="text-xs font-semibold text-zinc-400 uppercase tracking-tighter">
           {confluence.score >= 3 ? 'Strong Technical Setup' : confluence.score >= 2 ? 'Awaiting Confirmation' : 'No Clear Structure'}
         </p>
         <div className="mt-4 flex gap-2">
            <div className={`w-2 h-2 rounded-full ${confluence.hasOB ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-zinc-800'}`}></div>
            <div className={`w-2 h-2 rounded-full ${confluence.hasFVG ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-800'}`}></div>
            <div className={`w-2 h-2 rounded-full ${confluence.hasLiquidity ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-zinc-800'}`}></div>
            <div className={`w-2 h-2 rounded-full ${confluence.hasStructure ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' : 'bg-zinc-800'}`}></div>
         </div>
      </div>

      <LiveMarketPulse settings={settings} onPriceUpdate={onPriceSync} />
    </div>
  );
};

export default Dashboard;
