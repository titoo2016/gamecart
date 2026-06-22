import { useState, useEffect } from "react";
import { GameState, Team } from "@/game/types";
import { createGame, submitClue, revealCard, passTurn } from "@/game/engine";
import { useTeam } from "@/game/teamContext";
import ScoreBar from "@/components/game/ScoreBar";
import Board from "@/components/game/Board";
import SpymasterControls from "@/components/game/SpymasterControls";
import GameLog from "@/components/game/GameLog";
import GameOver from "@/components/game/GameOver";
import { useLocation } from "wouter";

export default function Game() {
  const [, setLocation] = useLocation();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { startingTeam } = useTeam();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const team = (searchParams.get("team") as Team) || startingTeam || "red";
    setGameState(createGame(team));
  }, []);

  if (!gameState) return (
    <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center font-sans text-muted-foreground text-xl">
      جاري التحميل...
    </div>
  );

  const handleClueSubmit = (word: string, count: number) => {
    setGameState((prev) => prev ? submitClue(prev, word, count) : null);
  };

  const handleCardClick = (id: number) => {
    setGameState((prev) => prev ? revealCard(prev, id) : null);
  };

  const handlePassTurn = () => {
    setGameState((prev) => prev ? passTurn(prev) : null);
  };

  const handlePlayAgain = () => {
    setLocation("/");
  };

  const teamLabel = (team: string) => team === "red" ? "الأحمر" : "الأزرق";

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans overflow-hidden">
      <ScoreBar state={gameState} />

      {gameState.phase === "spymaster-view" && (
        <div className={`w-full py-2 text-center font-sans font-bold text-sm md:text-base text-white ${gameState.currentTeam === 'red' ? 'bg-[hsl(var(--team-red))]' : 'bg-[hsl(var(--team-blue))]'}`}>
          شاشة رئيس الجواسيس — الفريق {teamLabel(gameState.currentTeam)}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row relative">
        <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 space-y-6">
          <Board
            cards={gameState.cards}
            phase={gameState.phase}
            onCardClick={handleCardClick}
            isSpymaster={gameState.phase === "spymaster-view"}
          />

          {gameState.phase === "spymaster-view" && (
            <SpymasterControls onSubmit={handleClueSubmit} />
          )}

          {gameState.phase === "playing" && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-card border border-card-border px-6 py-3 rounded-lg flex items-center gap-4 shadow-lg">
                <span className="font-sans text-muted-foreground text-sm">التلميح</span>
                <span className="font-sans font-bold text-xl">{gameState.clue?.word}</span>
                <span className="font-mono text-muted-foreground px-2">—</span>
                <span className="font-mono font-bold text-xl">{gameState.clue?.count}</span>
              </div>
              <div className="flex gap-4 items-center">
                <span className="font-sans text-sm text-muted-foreground">
                  تخمينات باقية: <strong className="text-foreground">{gameState.guessesRemaining}</strong>
                </span>
                <button
                  data-testid="button-pass-turn"
                  onClick={handlePassTurn}
                  className="px-4 py-2 border border-border rounded text-sm font-sans hover:bg-muted transition-colors"
                >
                  تخطي الدور
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-r border-border bg-card/30 flex flex-col h-64 lg:h-auto">
          <GameLog log={gameState.log} />
        </div>
      </div>

      {gameState.phase === "game-over" && (
        <GameOver state={gameState} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}
