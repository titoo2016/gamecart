import { Card as CardType } from "@/game/types";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Skull } from "lucide-react";
import { useRef } from "react";

interface CardProps {
  card: CardType;
  isSpymaster: boolean;
  isClickable: boolean;
  onClick: () => void;
}

export default function Card({ card, isSpymaster, isClickable, onClick }: CardProps) {
  const isRevealed = card.revealed;
  const isHidden = card.type === "hidden";
  const showTrueColor = !isHidden;

  const ref = useRef<HTMLButtonElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springX = useSpring(rawX, { stiffness: 300, damping: 30 });
  const springY = useSpring(rawY, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-12, 12]);

  // Glare position (percentage strings)
  const glareX = useTransform(springX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(springY, [-0.5, 0.5], ["0%", "100%"]);

  // Glare opacity based on distance from center
  const glareOpacity = useTransform(
    [springX, springY] as const,
    ([lx, ly]: number[]) => Math.min(Math.sqrt(lx * lx + ly * ly) * 0.6, 0.35)
  );

  // Combine glare position into a background string
  const glareBackground = useTransform(
    [glareX, glareY] as const,
    ([gx, gy]: string[]) =>
      `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.3) 0%, transparent 65%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isClickable || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  let bgColorClass = "bg-[hsl(var(--unrevealed-card))]";
  let textColorClass = "text-foreground";
  let borderClass = "border-card-border";
  let glowColor = "";

  if (showTrueColor) {
    switch (card.type) {
      case "red":
        bgColorClass = "bg-[hsl(var(--team-red))]";
        textColorClass = "text-white";
        borderClass = "border-[hsl(var(--team-red))]";
        glowColor = "rgba(220,38,38,0.55)";
        break;
      case "blue":
        bgColorClass = "bg-[hsl(var(--team-blue))]";
        textColorClass = "text-white";
        borderClass = "border-[hsl(var(--team-blue))]";
        glowColor = "rgba(30,136,229,0.55)";
        break;
      case "neutral":
        bgColorClass = "bg-[hsl(var(--neutral-card))]";
        textColorClass = "text-black";
        borderClass = "border-[hsl(var(--neutral-card))]";
        glowColor = "rgba(180,160,100,0.35)";
        break;
      case "assassin":
        bgColorClass = "bg-[hsl(var(--assassin-card))]";
        textColorClass = "text-white";
        borderClass = "border-white/20";
        glowColor = "rgba(0,0,0,0.7)";
        break;
    }
  }

  if (isSpymaster && !isRevealed) {
    bgColorClass += " opacity-75";
  }

  const isFlipped = isRevealed && !isSpymaster;

  return (
    <motion.button
      ref={ref}
      data-testid={`card-${card.id}`}
      className={`relative w-full h-full rounded-md md:rounded-lg border flex items-center justify-center p-1 md:p-2 overflow-hidden
        ${isClickable ? "cursor-pointer" : "cursor-default"}
      `}
      onClick={onClick}
      style={{
        perspective: "800px",
        transformStyle: "preserve-3d",
        rotateX: isClickable ? rotateX : 0,
        rotateY: isClickable ? rotateY : 0,
        boxShadow: isRevealed && glowColor
          ? `0 0 18px 2px ${glowColor}, 0 4px 24px rgba(0,0,0,0.5)`
          : "0 4px 12px rgba(0,0,0,0.3)",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={isClickable ? { scale: 1.06, z: 30 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <motion.div
        className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center p-2 rounded-md md:rounded-lg ${bgColorClass} ${borderClass}`}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.55, type: "spring", stiffness: 240, damping: 22 }}
        style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
      >
        <div
          className={`font-sans font-bold text-xs md:text-sm lg:text-base xl:text-lg text-center break-words w-full z-10 select-none ${textColorClass} ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}
          style={{ textShadow: glowColor ? `0 1px 8px ${glowColor}` : undefined }}
        >
          {card.word}
        </div>

        {showTrueColor && card.type === "assassin" && (
          <Skull className={`absolute opacity-20 w-3/4 h-3/4 ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`} />
        )}

        {/* Glare layer — now using top-level derived motion values */}
        {isClickable && (
          <motion.div
            className="absolute inset-0 rounded-md md:rounded-lg pointer-events-none z-20"
            style={{
              background: glareBackground,
              opacity: glareOpacity,
            }}
          />
        )}

        {/* Subtle inner border highlight */}
        <div className="absolute inset-0 rounded-md md:rounded-lg pointer-events-none z-10"
          style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }} />
      </motion.div>
    </motion.button>
  );
}
