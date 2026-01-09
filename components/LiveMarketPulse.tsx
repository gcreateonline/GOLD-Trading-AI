
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { TradingSettings, LivePriceData } from '../types';

interface LiveMarketPulseProps {
  settings: TradingSettings;
  onPriceUpdate?: (data: LivePriceData) => void;
}

const LiveMarketPulse: React.FC<LiveMarketPulseProps> = ({ settings, onPriceUpdate }) => {
  const [pulse, setPulse] = useState<string>('Searching live pulse...');
  const [marketData, setMarketData] = useState<LivePriceData | null>(null);
  const [sentiment, setSentiment] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('NEUTRAL');
  const [loading, setLoading] = useState(false);

  const fetchLiveMarketData = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Fetch comprehensive market data and sentiment
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find the absolute latest real-time accurate market price and statistics for ${settings.asset}. 
        Return EXACTLY this format (substitute values):
        PRICE: [Current numeric price, e.g. 2650.45]
        CHANGE: [24h % Change, e.g. +1.2%]
        HIGH: [24h High numeric]
        LOW: [24h Low numeric]
        SENTIMENT: [BULLISH/BEARISH/NEUTRAL]
        SUMMARY: [2-sentence news summary]`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const text = result.text || '';
      setPulse(text);

      // Improved parsing of the structured response to ensure numeric accuracy
      const extractNumeric = (key: string) => {
        const regex = new RegExp(`${key}:\\s*([\\d,.]+)`);
        const match = text.match(regex);
        return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
      };

      const price = extractNumeric('PRICE');
      const changeMatch = text.match(/CHANGE:\s*([+\-\d.%]+)/);
      const high = extractNumeric('HIGH');
      const low = extractNumeric('LOW');
      const sentimentMatch = text.match(/SENTIMENT:\s*(\w+)/);

      const newData: LivePriceData = {
        price: price > 0 ? price : (marketData?.price || 2500),
        change24h: changeMatch ? changeMatch[1] : '0%',
        high24h: high,
        low24h: low,
        lastUpdate: new Date().toLocaleTimeString(),
      };

      setMarketData(newData);
      if (onPriceUpdate && newData.price > 0) onPriceUpdate(newData);
      
      if (sentimentMatch) {
        const s = sentimentMatch[1].toUpperCase();
        if (s.includes('BULLISH')) setSentiment('BULLISH');
        else if (s.includes('BEARISH')) setSentiment('BEARISH');
        else setSentiment('NEUTRAL');
      }
    } catch (err) {
      setPulse('Failed to fetch real-time market data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMarketData();
    const interval = setInterval(fetchLiveMarketData, 60000); // Update every 60s
    return () => clearInterval(interval);
  }, [settings.asset]);

  const summary = pulse.split('SUMMARY:')[1]?.trim() || 'Monitoring institutional order flow and news...';

  return (
    <div className="flex-1 pl-8 flex flex-col justify-center border-l border-zinc-800">
       <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Market Data</span>
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
               <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></span>
               <span className="text-[8px] font-bold text-blue-400 uppercase">Real-Time Search</span>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded text-[9px] font-black border ${
            sentiment === 'BULLISH' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
            sentiment === 'BEARISH' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
            'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
          }`}>
            {sentiment}
          </div>
       </div>

       {marketData && (
         <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col">
               <span className="text-[9px] text-zinc-500 font-bold uppercase">24h Change</span>
               <span className={`text-sm font-bold ${marketData.change24h.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                 {marketData.change24h}
               </span>
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] text-zinc-500 font-bold uppercase">24h Range</span>
               <span className="text-xs font-mono text-zinc-300">
                 {marketData.low24h.toFixed(1)} - {marketData.high24h.toFixed(1)}
               </span>
            </div>
         </div>
       )}

       <div className="relative">
         {loading && (
           <div className="absolute inset-0 bg-[#13141b]/90 flex items-center justify-center text-[9px] text-zinc-500 font-bold uppercase z-10 gap-2">
             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
             Grounding Live Feed...
           </div>
         )}
         <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 italic">
           "{summary}"
         </p>
         {marketData && (
            <span className="text-[8px] text-zinc-600 font-bold mt-2 block">
              LAST AI SYNC: {marketData.lastUpdate}
            </span>
         )}
       </div>
    </div>
  );
};

export default LiveMarketPulse;
