"use client";

/**
 * Splits its container top/bottom with a draggable divider. Ratio lives in
 * component state only — resets to the default each load rather than
 * persisting, since the right panel's split is low-stakes (see the
 * chat-centric layout spec's "divider persistence" open question).
 */

import { useCallback, useRef, useState } from "react";

const DEFAULT_TOP_RATIO = 2 / 3;
const MIN_RATIO = 0.2;
const MAX_RATIO = 0.85;

type ResizableSplitProps = {
  top: React.ReactNode;
  bottom: React.ReactNode;
  topLabel: string;
  bottomLabel: string;
};

export function ResizableSplit({ top, bottom, topLabel, bottomLabel }: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topRatio, setTopRatio] = useState(DEFAULT_TOP_RATIO);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / rect.height;
    setTopRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio)));
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopDragging);
  }, [handlePointerMove]);

  const startDragging = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      setIsDragging(true);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", stopDragging);
    },
    [handlePointerMove, stopDragging]
  );

  return (
    <div ref={containerRef} className="flex h-full flex-col overflow-hidden">
      <div className="min-h-0 overflow-hidden" style={{ height: `${topRatio * 100}%` }}>
        {top}
      </div>
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={`Resize ${topLabel} and ${bottomLabel}`}
        onPointerDown={startDragging}
        className={`flex h-2.5 shrink-0 cursor-row-resize items-center justify-center border-y border-seymour-border transition-colors ${
          isDragging ? "bg-seymour-surface-2" : "hover:bg-seymour-surface-2"
        }`}
      >
        <div className="h-0.5 w-8 rounded-full bg-seymour-border" />
      </div>
      <div
        className="min-h-0 flex-1 overflow-hidden"
        style={{ height: `${(1 - topRatio) * 100}%` }}
      >
        {bottom}
      </div>
    </div>
  );
}
