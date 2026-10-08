"use client";

import { CURRENCY } from "@/lib/currency";
import { useState } from "react";

export default function SalaryRangeFilter({
  minName,
  maxName,
  defaultMin,
  defaultMax,
  floor = 0,
  ceiling = 5_000_000,
  step = 10_000,
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
  const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
  const initialMin = defaultMin ? clamp(Number(defaultMin) || floor, floor, ceiling) : floor;
  const initialMax = defaultMax ? clamp(Number(defaultMax) || ceiling, floor, ceiling) : ceiling;

  // The slider and the form values follow minVal/maxVal. The typed boxes show
  // minText/maxText instead, so what someone is typing is never rewritten
  // underneath them mid-keystroke (it's tidied up once they leave the box).
  const [minVal, setMinVal] = useState(initialMin);
  const [maxVal, setMaxVal] = useState(Math.max(initialMax, initialMin));
  const [minText, setMinText] = useState(String(initialMin));
  const [maxText, setMaxText] = useState(String(Math.max(initialMax, initialMin)));

  const typeMin = (raw: string) => {
    setMinText(raw);
    const n = Number(raw);
    if (raw.trim() !== "" && Number.isFinite(n)) setMinVal(clamp(n, floor, maxVal));
  };
  const typeMax = (raw: string) => {
    setMaxText(raw);
    const n = Number(raw);
    if (raw.trim() !== "" && Number.isFinite(n)) setMaxVal(clamp(n, minVal, ceiling));
  };
  const settleMin = () => {
    const v = clamp(minVal, floor, maxVal);
    setMinVal(v);
    setMinText(String(v));
  };
  const settleMax = () => {
    const v = clamp(maxVal, minVal, ceiling);
    setMaxVal(v);
    setMaxText(String(v));
  };

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
      {/* A handle left at its end-stop means "no limit", so nothing is sent —
          otherwise every Apply would look like a salary filter was chosen. */}
      {minVal > floor && <input type="hidden" name={minName} value={minVal} />}
      {maxVal < ceiling && <input type="hidden" name={maxName} value={maxVal} />}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="number"
          inputMode="numeric"
          value={minText}
          onChange={(e) => typeMin(e.target.value)}
          onBlur={settleMin}
          className={glass ? "aur-field aur-field-sm font-mono-num" : "w-full px-2 py-1.5 rounded-lg border border-line text-sm outline-none font-mono-num"}
          placeholder={`Min ${CURRENCY}`}
        />
        <span className={glass ? "text-paper/50 text-sm" : "text-muted text-sm"}>–</span>
        <input
          type="number"
          inputMode="numeric"
          value={maxText}
          onChange={(e) => typeMax(e.target.value)}
          onBlur={settleMax}
          className={glass ? "aur-field aur-field-sm font-mono-num" : "w-full px-2 py-1.5 rounded-lg border border-line text-sm outline-none font-mono-num"}
          placeholder={`Max ${CURRENCY}`}
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
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), maxVal);
            setMinVal(v);
            setMinText(String(v));
          }}
          className={thumbClass}
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          step={step}
          value={maxVal}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), minVal);
            setMaxVal(v);
            setMaxText(String(v));
          }}
          className={thumbClass}
        />
      </div>
    </div>
  );
}
