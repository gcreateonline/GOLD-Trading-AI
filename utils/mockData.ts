import { Candle } from '../types';

export const generateMockData = (count: number, basePrice: number = 2500.00, timeframe: string = '15M'): Candle[] => {
  const candles: Candle[] = [];
  let currentPrice = basePrice;
  
  // Map timeframe to milliseconds
  let intervalMs = 15 * 60 * 1000; // Default 15M
  if (timeframe === '1H') intervalMs = 60 * 60 * 1000;
  else if (timeframe === '4H') intervalMs = 4 * 60 * 60 * 1000;

  let currentTime = Date.now() - (count * intervalMs);

  // Generate backwards from base price to create a historical trail
  for (let i = 0; i < count; i++) {
    const volatility = currentPrice * 0.001; // 0.1% volatility
    const change = (Math.random() - 0.48) * volatility; // Slight upward bias
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.3;
    const low = Math.min(open, close) - Math.random() * volatility * 0.3;
    
    candles.push({
      time: currentTime,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000)
    });

    currentPrice = close;
    currentTime += intervalMs;
  }

  return candles;
};