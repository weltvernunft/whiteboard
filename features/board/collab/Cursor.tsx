"use client";
import React, { forwardRef } from "react";

type Props = {
  color: string;
  x?: number;
  y?: number;
  label?: string;
  toolIcon?: string;
};

const Cursor = forwardRef<HTMLDivElement, Props>(
  ({ color, x, y, label, toolIcon }, ref) => {
    return (
      <div
        ref={ref}
        className="pointer-events-none absolute will-change-transform"
        style={
          x != null && y != null
            ? { transform: `translate(${x}px, ${y}px)` }
            : undefined
        }
      >
        <svg width="24" height="36" viewBox="0 0 24 36" className="drop-shadow">
          <path
            d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.5 16.8829L0.5 1.19841L11.7841 12.3673H5.65376Z"
            fill={color}
          />
        </svg>
        {label ? (
          <div
            className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-black/70 text-white whitespace-nowrap"
            style={{ transform: `translateX(6px)` }}
          >
            <span>{label}</span>
            {toolIcon ? <span className="opacity-80">{toolIcon}</span> : null}
          </div>
        ) : null}
      </div>
    );
  }
);

Cursor.displayName = "Cursor";
export default Cursor;
