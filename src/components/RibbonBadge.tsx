import React from "react";

interface RibbonBadgeProps {
  text: string;
  color?: "yellow" | "red";
}

const RibbonBadge: React.FC<RibbonBadgeProps> = ({
  text,
  color = "yellow"
}) => {
  // Strong yellow, no text overlap, wide enough for the text
  const bg =
    color === "yellow"
      ? "bg-yellow-400 text-yellow-900"
      : "bg-red-500 text-white";
  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        top: 16,
        right: -20, // Move nearly flush with the card's right border
        width: 120,
        height: 36,
      }}
    >
      <div
        className={`
          rotate-12
          ${bg}
          font-bold text-xs tracking-wide
          py-2 px-4 shadow-lg
          rounded
          flex items-center justify-center
          w-full
          h-full
          text-center
          transition-all
          duration-200
          group-hover:bg-yellow-300
        `}
        style={{
          boxShadow: "0 2px 8px 0 rgba(0,0,0,0.16)",
          minWidth: 110,
          minHeight: 28,
          pointerEvents: "auto"
        }}
      >
        {text}
      </div>
    </div>
  );
};

export default RibbonBadge;