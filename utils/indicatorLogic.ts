
import { Candle, TradingSettings, OrderBlock, FVG, ConfluenceState, SignalType } from '../types';

export const calculateIndicators = (candles: Candle[], settings: TradingSettings) => {
  if (candles.length < 5) return { orderBlocks: [], fvgs: [], confluence: { score: 0, signal: 'NONE', isBETriggered: false } };

  const orderBlocks: OrderBlock[] = [];
  const fvgs: FVG[] = [];

  // Simple FVG Detection
  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG
    if (c3.low > c1.high) {
      fvgs.push({
        type: 'BULLISH',
        top: c3.low,
        bottom: c1.high,
        startTime: c2.time
      });
    }
    // Bearish FVG
    else if (c3.high < c1.low) {
      fvgs.push({
        type: 'BEARISH',
        top: c1.low,
        bottom: c3.high,
        startTime: c2.time
      });
    }
  }

  // Simple Order Block Detection (Last candle before impulse)
  for (let i = 1; i < candles.length - 2; i++) {
    const prev = candles[i];
    const impulse = candles[i + 1];
    const bodySize = Math.abs(impulse.close - impulse.open);
    const avgBody = candles.slice(i-5, i).reduce((acc, c) => acc + Math.abs(c.close - c.open), 0) / 5;

    if (bodySize > avgBody * 2) { // Impulse move
      if (impulse.close > impulse.open) { // Upward impulse
        orderBlocks.push({
          type: 'BULLISH',
          top: prev.high,
          bottom: prev.low,
          startTime: prev.time,
          isMitigated: false
        });
      } else { // Downward impulse
        orderBlocks.push({
          type: 'BEARISH',
          top: prev.high,
          bottom: prev.low,
          startTime: prev.time,
          isMitigated: false
        });
      }
    }
  }

  // Confluence Scoring for the latest price
  const lastPrice = candles[candles.length - 1].close;
  const lastHigh = candles[candles.length - 1].high;
  const lastLow = candles[candles.length - 1].low;

  const hasOB = orderBlocks.some(ob => 
    ob.type === 'BULLISH' ? lastPrice <= ob.top && lastPrice >= ob.bottom : 
                            lastPrice >= ob.bottom && lastPrice <= ob.top
  );
  
  const hasFVG = fvgs.some(fvg => 
    fvg.type === 'BULLISH' ? lastPrice >= fvg.bottom : lastPrice <= fvg.top
  );

  // Mocked state for the demonstration - typically derived from historical price sweeps
  const hasLiquidity = Math.random() > 0.4;
  const hasStructure = Math.random() > 0.3;

  let score = 0;
  if (hasOB) score++;
  if (hasFVG) score++;
  if (hasLiquidity) score++;
  if (hasStructure) score++;

  let signal: SignalType = 'NONE' as any;
  let entry, sl, tp1, tp2;
  let isBETriggered = false;
  let beLevel;

  const minMet = score >= settings.minConfluence;
  const obReqMet = !settings.requireOB || hasOB;
  const fvgReqMet = !settings.requireFVG || hasFVG;

  if (minMet && obReqMet && fvgReqMet) {
    const isBullish = candles[candles.length - 1].close > candles[candles.length - 5].close;
    signal = isBullish ? 'BUY' as any : 'SELL' as any;
    
    entry = lastPrice;
    const volatility = (lastHigh - lastLow) || entry * 0.001;
    
    if (isBullish) {
      sl = entry - (volatility * (1 + settings.slBuffer));
      const risk = entry - sl;
      tp1 = entry + (risk * settings.riskReward * 0.5);
      tp2 = entry + (risk * settings.riskReward);

      // Breakeven logic
      const targetMove = tp1 - entry;
      const currentMove = lastPrice - entry;
      if (currentMove >= targetMove * settings.beThreshold) {
        isBETriggered = true;
        beLevel = entry;
      }
    } else {
      sl = entry + (volatility * (1 + settings.slBuffer));
      const risk = sl - entry;
      tp1 = entry - (risk * settings.riskReward * 0.5);
      tp2 = entry - (risk * settings.riskReward);

      // Breakeven logic
      const targetMove = entry - tp1;
      const currentMove = entry - lastPrice;
      if (currentMove >= targetMove * settings.beThreshold) {
        isBETriggered = true;
        beLevel = entry;
      }
    }
  }

  return {
    orderBlocks: orderBlocks.slice(-5),
    fvgs: fvgs.slice(-5),
    confluence: {
      score,
      hasOB,
      hasFVG,
      hasLiquidity,
      hasStructure,
      signal,
      entry,
      sl,
      tp1,
      tp2,
      isBETriggered,
      beLevel
    }
  };
};
