
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const QuickChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const askLite = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResponse('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: `Briefly answer this trading question about ICT/Smart Money: ${input}`,
      });
      setResponse(result.text || 'No response.');
    } catch (err) {
      setResponse('Connection error.');
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div className="mt-6 border-t border-zinc-800 pt-6">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Quick Strategy Assistant</h3>
      <div className="bg-zinc-900/50 rounded p-3 mb-2 min-h-[60px] max-h-[120px] overflow-y-auto">
        {loading ? (
          <div className="flex gap-1 items-center h-full justify-center">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-400 leading-relaxed italic">
            {response || "Ask me about OBs, FVGs, or risk management..."}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && askLite()}
          placeholder="Ask lite AI..."
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500"
        />
        <button 
          onClick={askLite}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1 text-[10px] font-bold transition-colors"
        >
          GO
        </button>
      </div>
    </div>
  );
};

export default QuickChat;
