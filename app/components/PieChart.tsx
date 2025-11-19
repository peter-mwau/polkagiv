"use client";

import React, { useState } from "react";

interface PieChartProps {
  data: Array<{
    symbol: string;
    value: number;
    color: string;
    percentage: number;
    usdValue: number;
  }>;
  size?: number;
  showTooltip?: boolean;
}

export default function PieChart({
  data,
  size = 200,
  showTooltip = true,
}: PieChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full"
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          No data
        </span>
      </div>
    );
  }

  // Precompute segments with start positions to avoid reassigning during render
  const circumference = 2 * Math.PI * 15.9155;
  const segments = (() => {
    const list: Array<{
      symbol: string;
      color: string;
      usdValue: number;
      percentage: number;
      segmentLength: number;
      startPercent: number;
    }> = [];
    let acc = 0;
    for (const item of data) {
      const segmentPercentage = Math.max(0, Math.min(100, item.percentage));
      const startPercent = acc;
      const segmentLength = (segmentPercentage / 100) * circumference;
      list.push({
        symbol: item.symbol,
        color: item.color,
        usdValue: item.usdValue,
        percentage: segmentPercentage,
        segmentLength,
        startPercent,
      });
      acc += segmentPercentage;
    }
    return list;
  })();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 42 42"
        className="transform -rotate-90"
      >
        {segments.map((seg, index) => {
          // ensure dasharray uses the remaining circumference as the gap portion
          const gap = Math.max(0, circumference - seg.segmentLength);
          const strokeDasharray = `${seg.segmentLength} ${gap}`;
          // offset by the cumulative start percent so segments stack correctly
          const strokeDashoffset = circumference * (1 - seg.startPercent / 100);

          return (
            <circle
              key={index}
              cx="21"
              cy="21"
              r="15.9155"
              fill="transparent"
              stroke={seg.color}
              strokeWidth="3"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-500 ease-out cursor-pointer"
              style={{
                filter:
                  hoveredSegment === index
                    ? "brightness(1.2)"
                    : "brightness(1)",
                transform:
                  hoveredSegment === index ? "scale(1.02)" : "scale(1)",
              }}
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          );
        })}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {data.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Assets</div>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && hoveredSegment !== null && (
        <div
          className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg"
          style={{
            top: "50%",
            left: "110%",
            transform: "translateY(-50%)",
          }}
        >
          <div className="font-semibold">{data[hoveredSegment].symbol}</div>
          <div>${data[hoveredSegment].usdValue.toFixed(2)}</div>
          <div>{data[hoveredSegment].percentage.toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
}
