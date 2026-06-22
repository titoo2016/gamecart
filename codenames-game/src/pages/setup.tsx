import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useTeam } from "@/game/teamContext";
import { Team } from "@/game/types";
import { Crown, X, UserPlus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function TeamColumn({
  team,
  players,
  spymaster,
  onAddPlayer,
  onRemovePlayer,
  onSetSpymaster,
}: {
  team: Team;
  players: string[];
  spymaster: string;
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (name: string) => void;
  onSetSpymaster: (name: string) => void;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isRed = team === "red";
  const accent = isRed
    ? "border-[hsl(var(--team-red))]/40 shadow-[0_0_20px_rgba(229,57,53,0.1)]"
    : "border-[hsl(var(--team-blue))]/40 shadow-[0_0_20px_rgba(30,136,229,0.1)]";
  const headerBg = isRed ? "bg-[hsl(var(--team-red))]" : "bg-[hsl(var(--team-blue))]";
  const btnColor = isRed
    ? "border-[hsl(var(--team-red))]/50 text-[hsl(var(--team-red))] hover:bg-[hsl(var(--team-red))]/10"
    : "border-[hsl(var(--team-blue))]/50 text-[hsl(var(--team-blue))] hover:bg-[hsl(var(--team-blue))]/10";
  const crownColor = isRed ? "text-[hsl(var(--team-red))]" : "text-[hsl(var(--team-blue))]";

  const handleAdd = () => {
    const name = input.trim();
    if (!name || players.includes(name)) return;
    onAddPlayer(name);
    if (players.length === 0) onSetSpymaster(name);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className={`flex-1 border rounded-xl overflow-hidden ${accent}`}>
      <div className={`${headerBg} py-3 px-4 text-center`}>
        <h2 className="font-sans font-bold text-white text-lg">
          الفريق {isRed ? "الأحمر" : "الأزرق"}
        </h2>
      </div>

      <div className="p-4 space-y-4 bg-card/60">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            dir="rtl"
            placeholder="اسم اللاعب"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="font-sans bg-background border-border text-right"
            data-testid={`input-player-${team}`}
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            data-testid={`button-add-player-${team}`}
            className={`px-3 py-2 rounded-lg border font-sans text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed ${btnColor}`}
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 min-h-[120px]">
          {players.length === 0 && (
            <p className="text-muted-foreground text-sm font-sans text-center py-6 opacity-50">
              ضيف لاعبين للفريق
            </p>
          )}
          {players.map((name) => {
            const isSpy = name === spymaster;
            return (
              <div
                key={name}
                onClick={() => onSetSpymaster(name)}
                data-testid={`player-card-${team}-${name}`}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                  isSpy
                    ? isRed
                      ? "bg-[hsl(var(--team-red))]/15 border border-[hsl(var(--team-red))]/40"
                      : "bg-[hsl(var(--team-blue))]/15 border border-[hsl(var(--team-blue))]/40"
                    : "bg-background/50 border border-border hover:border-muted-foreground/40"
                }`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onRemovePlayer(name); }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  data-testid={`button-remove-player-${name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className="font-sans text-sm text-foreground flex-1 text-right px-2">{name}</span>
                {isSpy
                  ? <Crown className={`w-4 h-4 shrink-0 ${crownColor}`} />
                  : <span className="w-4 h-4 shrink-0" />
                }
              </div>
            );
          })}
        </div>

        {players.length > 0 && (
          <p className="text-xs text-muted-foreground font-sans text-center">
            اضغط على اسم لاختياره كرئيس جواسيس{" "}
            <Crown className="w-3 h-3 inline-block" />
          </p>
        )}
      </div>
    </div>
  );
}

export default function Setup() {
  const { startingTeam, red, blue, setRed, setBlue } = useTeam();
  const [, setLocation] = useLocation();

  const canStart = red.players.length >= 1 && blue.players.length >= 1 && red.spymaster && blue.spymaster;

  const addPlayer = (team: Team, name: string) => {
    if (team === "red") setRed({ ...red, players: [...red.players, name] });
    else setBlue({ ...blue, players: [...blue.players, name] });
  };

  const removePlayer = (team: Team, name: string) => {
    if (team === "red") {
      const players = red.players.filter((p) => p !== name);
      setRed({ players, spymaster: red.spymaster === name ? (players[0] ?? "") : red.spymaster });
    } else {
      const players = blue.players.filter((p) => p !== name);
      setBlue({ players, spymaster: blue.spymaster === name ? (players[0] ?? "") : blue.spymaster });
    }
  };

  const setSpymaster = (team: Team, name: string) => {
    if (team === "red") setRed({ ...red, spymaster: name });
    else setBlue({ ...blue, spymaster: name });
  };

  const handleStart = () => {
    setLocation(`/game?team=${startingTeam}`);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="z-10 w-full max-w-2xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-sans font-bold text-foreground">إعداد الفرق</h1>
          <p className="text-muted-foreground font-sans text-sm">
            ضيف لاعبين لكل فريق، واختار رئيس الجواسيس
          </p>
        </div>

        <div className="flex gap-4">
          <TeamColumn
            team="red"
            players={red.players}
            spymaster={red.spymaster}
            onAddPlayer={(n) => addPlayer("red", n)}
            onRemovePlayer={(n) => removePlayer("red", n)}
            onSetSpymaster={(n) => setSpymaster("red", n)}
          />
          <TeamColumn
            team="blue"
            players={blue.players}
            spymaster={blue.spymaster}
            onAddPlayer={(n) => addPlayer("blue", n)}
            onRemovePlayer={(n) => removePlayer("blue", n)}
            onSetSpymaster={(n) => setSpymaster("blue", n)}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setLocation("/")}
            className="px-5 py-3 rounded-lg border border-border text-muted-foreground font-sans text-sm hover:bg-muted transition-colors"
          >
            رجوع
          </button>
          <Button
            data-testid="button-start-from-setup"
            onClick={handleStart}
            disabled={!canStart}
            className="flex-1 h-12 font-sans font-bold text-base gap-2"
          >
            ابدأ اللعبة
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {!canStart && (red.players.length > 0 || blue.players.length > 0) && (
          <p className="text-center text-xs text-muted-foreground font-sans">
            محتاج لاعب واحد على الأقل في كل فريق
          </p>
        )}
      </div>
    </div>
  );
}
