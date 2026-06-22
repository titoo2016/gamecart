import { GameState } from "@/game/types";
import { useTeam } from "@/game/teamContext";
import { Crown } from "lucide-react";

const teamLabel = (team: string) => team === "red" ? "الأحمر" : "الأزرق";

export default function ScoreBar({ state }: { state: GameState }) {
  const isPlaying = state.phase === "playing";
  const { red, blue } = useTeam();

  const redSpy = red.spymaster || null;
  const blueSpy = blue.spymaster || null;
  const redPlayers = red.players.filter((p) => p !== redSpy);
  const bluePlayers = blue.players.filter((p) => p !== blueSpy);

  return (
    <div className="w-full bg-card border-b border-border p-3 flex items-center justify-between shadow-sm z-10 relative gap-2">

      {/* الفريق الأحمر */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-3 h-3 rounded-full bg-[hsl(var(--team-red))] shadow-[0_0_8px_rgba(229,57,53,0.6)] shrink-0" />
        <div className="font-sans flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-lg leading-none text-[hsl(var(--team-red))]">{state.redRemaining}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">الأحمر</span>
          </div>
          {redSpy && (
            <div className="flex items-center gap-1 mt-0.5">
              <Crown className="w-2.5 h-2.5 text-[hsl(var(--team-red))] shrink-0" />
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">{redSpy}</span>
            </div>
          )}
          {redPlayers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 max-w-[120px]">
              {redPlayers.map((p) => (
                <span key={p} className="text-[10px] bg-[hsl(var(--team-red))]/10 text-[hsl(var(--team-red))]/80 px-1.5 py-0.5 rounded-full truncate max-w-[60px]">{p}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* الوسط */}
      <div className="flex flex-col items-center shrink-0">
        {isPlaying ? (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-sans text-muted-foreground mb-1 whitespace-nowrap">
              عملاء {teamLabel(state.currentTeam)} بيخمنوا
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-sans font-bold border ${
              state.currentTeam === 'red'
                ? 'bg-[hsl(var(--team-red))]/10 border-[hsl(var(--team-red))]/30 text-[hsl(var(--team-red))]'
                : 'bg-[hsl(var(--team-blue))]/10 border-[hsl(var(--team-blue))]/30 text-[hsl(var(--team-blue))]'
            }`}>
              الدور شغال
            </div>
          </div>
        ) : state.phase === "spymaster-view" ? (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-sans text-muted-foreground mb-1 whitespace-nowrap">
              في انتظار التلميح
            </span>
            <div className="px-3 py-1 rounded-full text-xs font-sans font-bold bg-muted text-muted-foreground border border-border whitespace-nowrap">
              دور رئيس الجواسيس
            </div>
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full text-xs font-sans font-bold bg-muted text-muted-foreground border border-border">
            انتهت اللعبة
          </div>
        )}
      </div>

      {/* الفريق الأزرق */}
      <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
        <div className="w-3 h-3 rounded-full bg-[hsl(var(--team-blue))] shadow-[0_0_8px_rgba(30,136,229,0.6)] shrink-0" />
        <div className="font-sans flex flex-col items-end min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground hidden sm:inline">الأزرق</span>
            <span className="font-bold text-lg leading-none text-[hsl(var(--team-blue))]">{state.blueRemaining}</span>
          </div>
          {blueSpy && (
            <div className="flex items-center gap-1 mt-0.5 flex-row-reverse">
              <Crown className="w-2.5 h-2.5 text-[hsl(var(--team-blue))] shrink-0" />
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">{blueSpy}</span>
            </div>
          )}
          {bluePlayers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 justify-end max-w-[120px]">
              {bluePlayers.map((p) => (
                <span key={p} className="text-[10px] bg-[hsl(var(--team-blue))]/10 text-[hsl(var(--team-blue))]/80 px-1.5 py-0.5 rounded-full truncate max-w-[60px]">{p}</span>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
