import React from 'react';
import { TradingSettings } from '../types';
import QuickChat from './QuickChat';

interface SidebarProps {
  settings: TradingSettings;
  onSettingsChange: (s: TradingSettings) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ settings, onSettingsChange }) => {
  const updateSetting = <K extends keyof TradingSettings>(key: K, value: TradingSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <aside className="w-72 bg-[#13141b] border-r border-zinc-800 flex flex-col overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-6">Indicator Settings</h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Signal Requirements</h3>
            <div className="space-y-4">
              <Toggle label="Require Order Block" checked={settings.requireOB} onChange={(v) => updateSetting('requireOB', v)} />
              <Toggle label="Require FVG" checked={settings.requireFVG} onChange={(v) => updateSetting('requireFVG', v)} />
              <Toggle label="Require Liquidity" checked={settings.requireLiquidity} onChange={(v) => updateSetting('requireLiquidity', v)} />
              
              <div className="pt-2">
                <label className="text-xs text-zinc-400 block mb-2">Min Confluence (1-4)</label>
                <input 
                  type="range" min="1" max="4" 
                  value={settings.minConfluence}
                  onChange={(e) => updateSetting('minConfluence', parseInt(e.target.value))}
                  className="w-full accent-blue-500 bg-zinc-800 rounded-lg h-1.5"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>Aggressive</span>
                  <span>Balanced</span>
                  <span>Conservative</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Risk Management</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Risk : Reward Ratio (1:{settings.riskReward})</label>
                <input 
                  type="number" step="0.5" min="1" max="10"
                  value={settings.riskReward}
                  onChange={(e) => updateSetting('riskReward', parseFloat(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">SL Buffer (%)</label>
                <input 
                  type="number" step="0.01" min="0"
                  value={settings.slBuffer}
                  onChange={(e) => updateSetting('slBuffer', parseFloat(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Visual Layers</h3>
            <div className="space-y-4">
              <Toggle label="Show Order Blocks" checked={settings.showOB} onChange={(v) => updateSetting('showOB', v)} />
              <Toggle label="Show Fair Value Gaps" checked={settings.showFVG} onChange={(v) => updateSetting('showFVG', v)} />
              <Toggle label="Show Market Structure" checked={settings.showStructure} onChange={(v) => updateSetting('showStructure', v)} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Asset & Timeframe</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Asset</label>
                <select 
                  value={settings.asset} 
                  onChange={(e) => updateSetting('asset', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="XAUUSD">GOLD (XAUUSD)</option>
                  <option value="BTCUSD">BITCOIN (BTCUSD)</option>
                  <option value="EURUSD">EUR/USD</option>
                  <option value="NAS100">NASDAQ (NAS100)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Timeframe</label>
                <select 
                  value={settings.timeframe} 
                  onChange={(e) => updateSetting('timeframe', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="15M">15 Minutes</option>
                  <option value="1H">1 Hour</option>
                  <option value="4H">4 Hours</option>
                </select>
              </div>
            </div>
          </div>

          <QuickChat />
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Status</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] text-green-500 font-bold uppercase">AI Synchronized</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between cursor-pointer group">
    <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">{label}</span>
    <div className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
    </div>
  </label>
);

export default Sidebar;