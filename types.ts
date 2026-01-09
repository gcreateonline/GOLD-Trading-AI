
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
  NONE = 'NONE'
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface LivePriceData {
  price: number;
  change24h: string;
  high24h: number;
  low24h: number;
  lastUpdate: string;
  source?: string;
}

export interface OrderBlock {
  type: 'BULLISH' | 'BEARISH';
  top: number;
  bottom: number;
  startTime: number;
  isMitigated: boolean;
}

export interface FVG {
  type: 'BULLISH' | 'BEARISH';
  top: number;
  bottom: number;
  startTime: number;
}

export interface ConfluenceState {
  score: number;
  hasOB: boolean;
  hasFVG: boolean;
  hasLiquidity: boolean;
  hasStructure: boolean;
  signal: SignalType;
  entry?: number;
  sl?: number;
  tp1?: number;
  tp2?: number;
  isBETriggered: boolean;
  beLevel?: number;
}

export interface TradingSettings {
  requireOB: boolean;
  requireFVG: boolean;
  requireLiquidity: boolean;
  minConfluence: number;
  riskReward: number;
  slBuffer: number;
  beThreshold: number; 
  showOB: boolean;
  showFVG: boolean;
  showStructure: boolean;
  asset: string;
  timeframe: string;
}
