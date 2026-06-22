import { OnlineGameState } from "@/game/types";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Skull, Trophy } from "lucide-react";

interface GameOverProps {
  state: OnlineGameState;
  onPlayAgain?: () => void;
}

export default function GameOver({ state, onPlayAgain }: GameOverProps) {
  const isAssassin = state.winReason === "assassin";
  const winner = state.winner;

  const bgGradient = winner === "red"
    ? "from-[hsl(var(--team-red))]/20 to-transparent"
    : "from-[hsl(var(--team-blue))]/20 to-transparent";

  const titleColor = winner === "red" ? "text-[hsl(var(--team-red))]" : "text-[hsl(var(--team-blue))]";
  const teamLabel = winner === "red" ? "الأحمر" : "الأزرق";

  return (
    <div dir="rtl" className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`bg-card border border-card-border p-8 md:p-12 rounded-2xl shadow-2xl max-w-lg w-full text-center relative overflow-hidden bg-gradient-to-b ${bgGradient}`}
      >
        <div className="relative z-10 flex flex-col items-center gap-6">
          {isAssassin ? (
            <Skull className="w-24 h-24 text-[hsl(var(--assassin-card))]" />
          ) : (
            <Trophy className={`w-24 h-24 ${titleColor}`} />
          )}
          <div className="space-y-2">
            <h2 className={`text-4xl md:text-5xl font-sans font-bold ${titleColor}`}>
              الفريق {teamLabel} كسب!
            </h2>
            <p className="text-muted-foreground font-sans text-sm md:text-base">
              {isAssassin ? "وقعتوا في إيد القاتل!" : "اتشالت كل الكلمات!"}
            </p>
          </div>
          {onPlayAgain ? (
            <Button
              data-testid="button-play-again"
              onClick={onPlayAgain}
              size="lg"
              className="mt-8 font-sans font-bold"
            >
              العب تاني
            </Button>
          ) : (
            <p className="text-muted-foreground text-sm font-sans mt-4">في انتظار الهوست يبدأ لعبة جديدة...</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
