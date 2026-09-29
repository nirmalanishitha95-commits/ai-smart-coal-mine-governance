import React from "react";

export const getRiskColor = (level) => {
  switch (level?.toUpperCase()) {
    case "CRITICAL":
      return {
        bg: "bg-[#DC2626]/10",
        text: "text-[#DC2626]",
        border: "border-[#DC2626]/30",
        dot: "bg-[#DC2626]"
      };
    case "HIGH":
      return {
        bg: "bg-[#EA580C]/10",
        text: "text-[#EA580C]",
        border: "border-[#EA580C]/30",
        dot: "bg-[#EA580C]"
      };
    case "MEDIUM":
      return {
        bg: "bg-[#D97706]/10",
        text: "text-[#D97706]",
        border: "border-[#D97706]/30",
        dot: "bg-[#D97706]"
      };
    case "LOW":
    default:
      return {
        bg: "bg-[#15803D]/10",
        text: "text-[#15803D]",
        border: "border-[#15803D]/30",
        dot: "bg-[#15803D]"
      };
  }
};

export default function RiskBadge({ level, score, showScore = true, size = "md" }) {
  const colors = getRiskColor(level);
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      <span>{level || "LOW"}</span>
      {showScore && score !== undefined && (
        <span className="opacity-80 font-mono text-[10px]">({Math.round(score)})</span>
      )}
    </span>
  );
}
