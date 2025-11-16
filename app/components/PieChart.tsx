// components/PieChart.tsx
"use client";

import React from "react";

interface PieChartProps {
  data: Array<{
    symbol: string;
    value: number;
    color: string;
    percentage: number;
  }>;
  size?: number;
}

export default function PieChart({ data, size = 200 }: PieChartProps) {
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

  let accumulatedPercentage = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 42 42"
        className="transform -rotate-90"
      >
        {data.map((item, index) => {
          const segmentPercentage = item.percentage;
          const dashArray = 2 * Math.PI * 15.9155; // circumference
          const dashOffset = dashArray * (1 - accumulatedPercentage / 100);

          accumulatedPercentage += segmentPercentage;

          return (
            <circle
              key={index}
              cx="21"
              cy="21"
              r="15.9155"
              fill="transparent"
              stroke={item.color}
              strokeWidth="3"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500 ease-out"
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
    </div>
  );
}
