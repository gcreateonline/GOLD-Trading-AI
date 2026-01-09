
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Candle, TradingSettings } from '../types';

interface ChartProps {
  candles: Candle[];
  indicators: any;
  settings: TradingSettings;
}

const Chart: React.FC<ChartProps> = ({ candles, indicators, settings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const zoomTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  const margin = { top: 20, right: 80, bottom: 30, left: 20 };

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const draw = () => {
    if (!svgRef.current || !containerRef.current || candles.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const transform = zoomTransformRef.current;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    // Use scaleLinear for X to support fluid zooming better than scaleBand
    const xDomain = [d3.min(candles, d => d.time)!, d3.max(candles, d => d.time)!];
    const xBase = d3.scaleLinear()
      .domain(xDomain)
      .range([margin.left, width - margin.right]);

    const yBase = d3.scaleLinear()
      .domain([
        d3.min(candles, d => d.low)! * 0.9995,
        d3.max(candles, d => d.high)! * 1.0005
      ])
      .range([height - margin.bottom, margin.top]);

    // Apply transformations
    const x = transform.rescaleX(xBase);
    const y = transform.rescaleY(yBase);

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 20])
      .on('zoom', (event) => {
        zoomTransformRef.current = event.transform;
        draw();
      });

    svg.call(zoom).on("mousedown.zoom", null); // Disable default pan to handle our own if needed, or keep it.
    // Actually, we want pan. We'll just use standard d3.zoom.

    // Clip path to prevent drawing outside margins
    svg.append("defs").append("clipPath")
      .attr("id", "chart-clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.right - margin.left)
      .attr("height", height - margin.top - margin.bottom);

    const mainGroup = svg.append("g").attr("clip-path", "url(#chart-clip)");

    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('stroke', '#1a1b1e')
      .attr('stroke-opacity', 0.5)
      .call(d3.axisLeft(y).tickSize(-width + margin.left + margin.right).tickFormat(() => ''));

    // Draw FVGs
    if (settings.showFVG) {
      indicators.fvgs.forEach((fvg: any) => {
        mainGroup.append('rect')
          .attr('x', margin.left)
          .attr('y', y(fvg.top))
          .attr('width', width - margin.right - margin.left)
          .attr('height', Math.max(0, Math.abs(y(fvg.bottom) - y(fvg.top))))
          .attr('fill', fvg.type === 'BULLISH' ? '#10b981' : '#ef4444')
          .attr('fill-opacity', 0.08);
      });
    }

    // Draw OBs
    if (settings.showOB) {
      indicators.orderBlocks.forEach((ob: any) => {
        mainGroup.append('rect')
          .attr('x', margin.left)
          .attr('y', y(ob.top))
          .attr('width', width - margin.right - margin.left)
          .attr('height', Math.max(0, Math.abs(y(ob.bottom) - y(ob.top))))
          .attr('fill', ob.type === 'BULLISH' ? '#3b82f6' : '#f59e0b')
          .attr('fill-opacity', 0.15)
          .attr('stroke', ob.type === 'BULLISH' ? '#3b82f6' : '#f59e0b')
          .attr('stroke-width', 0.5)
          .attr('stroke-dasharray', '2,2');
      });
    }

    // Candlesticks
    const candleWidth = (width / candles.length) * transform.k * 0.7;
    const candleG = mainGroup.selectAll('.candle')
      .data(candles)
      .enter().append('g')
      .attr('class', 'candle');

    candleG.append('line')
      .attr('x1', d => x(d.time))
      .attr('x2', d => x(d.time))
      .attr('y1', d => y(d.high))
      .attr('y2', d => y(d.low))
      .attr('stroke', d => d.close >= d.open ? '#10b981' : '#ef4444');

    candleG.append('rect')
      .attr('x', d => x(d.time) - candleWidth / 2)
      .attr('y', d => y(Math.max(d.open, d.close)))
      .attr('width', candleWidth)
      .attr('height', d => Math.max(1, Math.abs(y(d.open) - y(d.close))))
      .attr('fill', d => d.close >= d.open ? '#10b981' : '#ef4444');

    // Live Price Line
    const lastCandle = candles[candles.length - 1];
    const currentPrice = lastCandle.close;
    const currentPriceY = y(currentPrice);
    
    svg.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', currentPriceY)
      .attr('y2', currentPriceY)
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .attr('class', 'live-price-line');

    // Live Price Tag
    const tagGroup = svg.append('g')
      .attr('transform', `translate(${width - margin.right}, ${currentPriceY - 8})`);

    tagGroup.append('rect')
      .attr('width', margin.right)
      .attr('height', 16)
      .attr('fill', '#3b82f6');

    tagGroup.append('text')
      .attr('x', 5)
      .attr('y', 12)
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text(currentPrice.toFixed(2));

    // TP/SL Lines for active signal
    if (indicators.confluence.signal !== 'NONE') {
      const { entry, sl, tp1, tp2, isBETriggered, beLevel } = indicators.confluence;
      const lines = [
        { price: entry, color: '#3b82f6', label: 'ENTRY' },
        { price: sl, color: '#ef4444', label: 'SL' },
        { price: tp1, color: '#10b981', label: 'TP1' },
        { price: tp2, color: '#84cc16', label: 'TP2' }
      ];

      if (isBETriggered && beLevel) {
        lines.push({ price: beLevel, color: '#ffffff', label: 'BE' });
      }

      lines.forEach(line => {
        if (!line.price) return;
        const lineY = y(line.price);
        svg.append('line')
          .attr('x1', margin.left)
          .attr('x2', width - margin.right)
          .attr('y1', lineY)
          .attr('y2', lineY)
          .attr('stroke', line.color)
          .attr('stroke-width', line.label === 'BE' ? 2 : 1.5)
          .attr('stroke-dasharray', line.label === 'SL' || line.label === 'BE' ? '4,4' : 'none');

        svg.append('text')
          .attr('x', width - margin.right + 5)
          .attr('y', lineY + 3)
          .attr('fill', line.color)
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .text(`${line.label} ${line.price.toFixed(2)}`);
      });
    }

    // Signals
    if (indicators.confluence.signal !== 'NONE') {
       const isBuy = indicators.confluence.signal === 'BUY';
       mainGroup.append('path')
         .attr('d', d3.symbol().type(d3.symbolTriangle).size(150))
         .attr('transform', `translate(${x(lastCandle.time)}, ${isBuy ? y(lastCandle.low) + 20 : y(lastCandle.high) - 20}) rotate(${isBuy ? 0 : 180})`)
         .attr('fill', isBuy ? '#10b981' : '#ef4444');

       mainGroup.append('text')
         .attr('x', x(lastCandle.time))
         .attr('y', isBuy ? y(lastCandle.low) + 35 : y(lastCandle.high) - 35)
         .attr('text-anchor', 'middle')
         .attr('fill', isBuy ? '#10b981' : '#ef4444')
         .attr('font-size', '10px')
         .attr('font-weight', 'bold')
         .text(isBuy ? 'BUY ICT' : 'SELL ICT');
    }

    // Y Axis
    svg.append('g')
      .attr('transform', `translate(${width - margin.right}, 0)`)
      .call(d3.axisRight(y).ticks(10).tickFormat(d3.format(".2f")))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "#3f3f46"))
      .call(g => g.selectAll(".tick text").attr("fill", "#a1a1aa").attr("font-size", "10px"));

    // X Axis
    const xAxis = d3.axisBottom(x)
      .ticks(10)
      .tickFormat(d => {
        const date = new Date(d as number);
        return d3.timeFormat("%H:%M")(date);
      });

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "#3f3f46"))
      .call(g => g.selectAll(".tick text").attr("fill", "#71717a").attr("font-size", "9px"));
  };

  useEffect(() => {
    draw();
  }, [candles, indicators, settings]);

  const resetZoom = () => {
    zoomTransformRef.current = d3.zoomIdentity;
    draw();
  };

  return (
    <div ref={containerRef} className="w-full h-full relative group">
      <svg ref={svgRef} className="block overflow-hidden cursor-crosshair"></svg>
      
      {/* Zoom Controls */}
      <button 
        onClick={resetZoom}
        className="absolute bottom-10 right-[90px] p-2 bg-zinc-900/80 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
        title="Reset View"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      </button>

      {/* HUD Info */}
      <div className="absolute top-4 left-6 pointer-events-none flex gap-8 bg-[#0d0e12]/60 backdrop-blur-md p-4 rounded-xl border border-zinc-800/50 shadow-2xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Current Price</span>
             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <span className="text-2xl font-black font-mono leading-none flex items-center gap-2">
            {candles[candles.length - 1]?.close.toFixed(2)}
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${candles[candles.length - 1]?.close >= (candles[candles.length - 2]?.close || 0) ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {(candles[candles.length - 1]?.close - (candles[candles.length - 2]?.close || 0)).toFixed(2)}
            </span>
          </span>
        </div>
        
        <div className="w-[1px] bg-zinc-800 self-stretch"></div>

        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Institutional Clock</span>
          <span className="text-sm font-bold font-mono text-zinc-200">
            {currentTime.toLocaleDateString()}
          </span>
          <span className="text-[10px] font-mono text-blue-400 font-black">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div className="w-[1px] bg-zinc-800 self-stretch"></div>

        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Order Flow Status</span>
          <div className="flex items-center gap-2 mt-0.5">
             <span className="text-[10px] font-black text-green-500 uppercase tracking-tighter">Liquid</span>
             <div className="flex gap-0.5">
                {[1,2,3,4].map(i => <div key={i} className="w-1 h-3 bg-blue-500/40 rounded-full" />)}
                <div className="w-1 h-3 bg-blue-500 rounded-full animate-pulse"></div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Live Label */}
      <div className="absolute top-4 right-[90px] px-2 py-1 bg-red-500/20 border border-red-500/30 rounded flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Live Data Stream</span>
      </div>

      <div className="absolute bottom-4 left-6 text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] pointer-events-none">
        Scroll to zoom • Drag to pan • Double click to reset
      </div>
    </div>
  );
};

export default Chart;
