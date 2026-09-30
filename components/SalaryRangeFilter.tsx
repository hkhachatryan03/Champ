"use client";

import { useState } from "react";

export default function SalaryRangeFilter({
  minName,
  maxName,
  defaultMin,
  defaultMax,
  floor = 0,
  ceiling = 5000,
  step = 50,
  glass = false,
}: {
  minName: string;
  maxName: string;
  defaultMin?: string;
  defaultMax?: string;
  floor?: number;
  ceiling?: number;
  step?: number;
  /** Dark "Ethereal Glass" look for the public guest pages. */
  glass?: boolean;
}) {
  const [minVal, setMinVal] = useState(defaultMin ? Number(defaultMin) : floor);
  const [maxVal, setMaxVal] = useState(defaultMax ? Number(defaultMax) : ceiling);

  const range = ceiling - floor;
  const leftPct = ((minVal - floor) / range) * 100;
  const rightPct = 100 - ((maxVal - floor) / range) * 100;

  const glassThumb =
    "absolute top-0 left-0 w-full appearance-none bg-transparent pointer-events-none " +
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[17px] [&::-webkit-slider-thumb]:h-[17px] " +
    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-paper [&::-webkit-slider-thumb]:cursor-grab " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(234,154,46,.25),0_2px_6px_rgba(0,0,0,.5)] " +
    "[&::-moz-range-thumb]:w-[17px] [&::-moz-range-thumb]:h-[17px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-paper " +
    "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:pointer-events-auto " +
    "[&::-moz-range-thumb]:shadow-[0_0_0_4px_rgba(234,154,46,.25)]";

  const thumbClass = glass ? glassThumb :
    "absolute top-0 left-0 w-full appearance-none bg-transparent pointer-events-none " +
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 " +
    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-apricot [&::-webkit-slider-thumb]:cursor-pointer " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow " +
    "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-apricot " +
    "[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white";

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="number"
          name={minName}
          value={minVal}
          min={floor}
          max={maxVal}
          onChange={(e) => setMinVal(Math.min(Number(e.target.value) || floor, maxVal))}
          className={glass ? "aur-field aur-field-sm font-mono-num" : "w-full px-2 py-1.5 rounded-lg border border-line text-sm outline-none font-mono-num"}
          placeholder="Min $"
        />
        <span className={glass ? "text-paper/50 text-sm" : "text-muted text-sm"}>–</span>
        <input
          type="number"
          name={maxName}
          value={maxVal}
          min={minVal}
          max={ceiling}
          onChange={(e) => setMaxVal(Math.max(Number(e.target.value) || ceiling, minVal))}
          className={glass ? "aur-field aur-field-sm font-mono-num" : "w-full px-2 py-1.5 rounded-lg border border-line text-sm outline-none font-mono-num"}
          placeholder="Max $"
        />
      </div>
      <div className={glass ? "relative h-5 mx-1" : "relative h-4"}>
        <div className={glass ? "absolute top-1/2 left-0 right-0 h-[3px] bg-paper/15 rounded-full -translate-y-1/2" : "absolute top-1/2 left-0 right-0 h-1 bg-line rounded-full -translate-y-1/2"} />
        <div
          className="absolute top-1/2 h-1 bg-apricot rounded-full -translate-y-1/2"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          step={step}
          value={minVal}
          onChange={(e) => setMinVal(Math.min(Number(e.target.value), maxVal))}
          className={thumbClass}
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          step={step}
          value={maxVal}
          onChange={(e) => setMaxVal(Math.max(Number(e.target.value), minVal))}
          className={thumbClass}
        />
      </div>
    </div>
  );
}
