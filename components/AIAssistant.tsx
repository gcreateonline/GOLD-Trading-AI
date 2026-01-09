
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Candle, ConfluenceState, TradingSettings, GroundingChunk } from '../types';

interface AIAssistantProps {
  candles: Candle[];
  confluence: ConfluenceState;
  settings: TradingSettings;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ candles, confluence, settings }) => {
  const [analysis, setAnalysis] = useState<string>('Initiate complex institutional analysis...');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<GroundingChunk[]>([]);

  const analyzeSetup = async () => {
    setLoading(true);
    setAnalysis('Connecting to Pro Intelligence Hub & Performing Web Grounding...');
    setSources([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const lastCandles = candles.slice(-5);
      
      const prompt = `
        You are a World-Class Institutional Trader at a top-tier investment bank.
        Task: Provide a complex analysis for the asset ${settings.asset} based on current chart data and web-grounded market context.
        
        CHART DATA:
        Price: ${candles[candles.length - 1].close}
        Confluence Score: ${confluence.score}/4 (OB: ${confluence.hasOB}, FVG: ${confluence.hasFVG})
        Recent Action: ${lastCandles.map(c => c.close).join(', ')}

        INSTRUCTIONS:
        1. Use Google Search to find any high-impact economic events (FOMC, NFP, CPI, etc.) or major news affecting ${settings.asset} today.
        2. Synthesize the chart confluence with this live context.
        3. Identify if the current technical setup is invalidated by upcoming news.
        4. Give a "Pro Confidence" score from 0-100%.
        5. Conclude with a clear: "TRADE", "WAIT", or "NO TRADE".
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      setAnalysis(response.text || 'Institutional nodes unavailable.');
      
      // Extract grounding metadata if available
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setSources(chunks as GroundingChunk[]);
      }
    } catch (error) {
      console.error(error);
      setAnalysis('Critical error in Pro Intelligence layer. Check API credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col bg-zinc-900/40 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
           <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Pro Intelligence & Search Grounding</h3>
        </div>
        <button 
          onClick={analyzeSetup}
          disabled={loading}
          className="px-3 py-1 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold border border-blue-500/30 transition-all uppercase disabled:opacity-50"
        >
          {loading ? 'Synthesizing...' : 'Run Pro Analysis'}
        </button>
      </div>

      <div className="flex-1 bg-zinc-950/40 border border-zinc-800/50 rounded-lg p-4 overflow-y-auto custom-scrollbar">
         <div className="prose prose-invert prose-sm max-w-none">
           <p className="text-zinc-300 leading-relaxed font-medium text-[13px] whitespace-pre-wrap">
             {analysis}
           </p>
         </div>

         {sources.length > 0 && (
           <div className="mt-4 pt-4 border-t border-zinc-800">
             <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Verified Sources:</span>
             <div className="flex flex-wrap gap-2">
                {sources.map((src, i) => src.web && (
                  <a key={i} href={src.web.uri} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 underline bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 truncate max-w-[200px]">
                    {src.web.title || 'Source'}
                  </a>
                ))}
             </div>
           </div>
         )}
      </div>

      {loading && (
        <div className="absolute bottom-6 right-8">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-full shadow-2xl">
              <span className="text-[9px] font-bold text-zinc-400 animate-pulse">GROUNDING...</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
