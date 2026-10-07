import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronsRight, Loader2 } from "lucide-react";

interface SlideButtonProps {
  label: string;
  onSuccess: () => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  themeColor?: "fuchsia" | "blue" | "emerald";
}

export const SlideButton: React.FC<SlideButtonProps> = ({
  label,
  onSuccess,
  isLoading = false,
  disabled = false,
  themeColor = "fuchsia",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const maxDragRef = useRef(0);

  const colorStyles = {
    fuchsia: {
      trackBg: "bg-gradient-to-r from-fuchsia-600 to-pink-600",
      thumbBg: "bg-white text-fuchsia-600",
      progressBg: "bg-white/20",
    },
    blue: {
      trackBg: "bg-gradient-to-r from-blue-600 to-indigo-600",
      thumbBg: "bg-white text-blue-600",
      progressBg: "bg-white/20",
    },
    emerald: {
      trackBg: "bg-gradient-to-r from-emerald-600 to-teal-600",
      thumbBg: "bg-white text-emerald-600",
      progressBg: "bg-white/20",
    },
  }[themeColor];

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const max = maxDragRef.current;
    if (max > 0 && dragOffset >= max * 0.75 && !disabled && !isLoading) {
      setDragOffset(0);
      onSuccess();
    } else {
      // Snap back
      setDragOffset(0);
    }
  }, [isDragging, dragOffset, disabled, isLoading, onSuccess]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || disabled || isLoading) return;
      const currentX = e.clientX;
      const deltaX = currentX - startXRef.current;
      const max = maxDragRef.current;
      const newOffset = Math.max(0, Math.min(deltaX, max));
      setDragOffset(newOffset);
    };

    const handlePointerUp = () => {
      handleDragEnd();
    };

    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging, disabled, isLoading, handleDragEnd]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isLoading) return;
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const thumbWidth = 52;
    maxDragRef.current = containerRect.width - thumbWidth - 8; // 8px padding
    startXRef.current = e.clientX - dragOffset;
    setIsDragging(true);
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-14 rounded-2xl select-none overflow-hidden p-1 shadow-md transition-opacity ${
        colorStyles.trackBg
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ touchAction: "none" }}
    >
      {/* Background fill based on slide offset */}
      <div
        className={`absolute inset-y-0 left-0 ${colorStyles.progressBg} transition-all duration-75`}
        style={{ width: `${dragOffset + 52}px` }}
      />

      {/* Center Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
        <span className="text-white text-sm font-semibold tracking-wide drop-shadow-sm flex items-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <span>{label}</span>
              <ChevronsRight className="w-4 h-4 text-white/80 animate-pulse" />
            </>
          )}
        </span>
      </div>

      {/* Slider Thumb */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? "none" : "transform 0.25s ease-out",
        }}
        className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform ${
          colorStyles.thumbBg
        } ${isDragging ? "scale-95" : "hover:scale-105 active:scale-95"}`}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ChevronsRight className="w-5 h-5" />
        )}
      </div>
    </div>
  );
};
