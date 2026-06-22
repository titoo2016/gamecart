import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { getSocket } from "@/lib/socket";
import { RoomState, OnlineGameState, Team } from "@/game/types";
import { Crown, Copy, Check, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScoreBar from "@/components/game/ScoreBar";
import Board from "@/components/game/Board";
import SpymasterControls from "@/components/game/SpymasterControls";
import GameLog from "@/components/game/GameLog";
import GameOver from "@/components/game/GameOver";

function RoomCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/room/${code}`;
  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-2 bg-card border border-card-border rounded-lg px-4 py-2">
      <span className="text-muted-foreground text-sm font-sans">كود الغرفة:</span>
      <span className="font-mono font-bold text-2xl tracking-widest text-foreground">{code}</span>
      <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors ml-1" title="نسخ الرابط">
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

function PlayerCard({ player, myId, onSetSpymaster, onSetTeam, isLobby }: {
  player: RoomState["players"][0];
  myId: string;
  onSetSpymaster: () => void;
  onSetTeam: (team: Team) => void;
  isLobby: boolean;
}) {
  const isMe = player.id === myId;
  const isRed = player.team === "red";
  const teamColor = isRed
    ? "border-[hsl(var(--team-red))]/40 bg-[hsl(var(--team-red))]/5"
    : "border-[hsl(var(--team-blue))]/40 bg-[hsl(var(--team-blue))]/5";
  const nameColor = isRed ? "text-[hsl(var(--team-red))]" : "text-[hsl(var(--team-blue))]";
  const crownColor = isRed ? "text-[hsl(var(--team-red))]" : "text-[hsl(var(--team-blue))]";

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${teamColor} ${!player.connected ? "opacity-40" : ""}`}>
      {player.isSpymaster ? (
        <Crown className={`w-4 h-4 shrink-0 ${crownColor}`} />
      ) : (
        <Users className="w-4 h-4 shrink-0 text-muted-foreground" />
      )}
      <span className={`font-sans text-sm flex-1 ${nameColor} ${isMe ? "font-bold" : ""}`}>
        {player.name}{isMe ? " (أنا)" : ""}{player.isHost ? " 👑" : ""}
        {!player.connected && " (خارج)"}
      </span>
      {isMe && isLobby && (
        <div className="flex gap-1">
          {!player.isSpymaster && (
            <button
              onClick={onSetSpymaster}
              className="text-[9px] font-sans px-2 py-0.5 rounded border border-card-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              رئيس
            </button>
          )}
          <button
            onClick={() => onSetTeam(player.team === "red" ? "blue" : "red")}
            className={`text-[9px] font-sans px-2 py-0.5 rounded border transition-colors ${
              isRed
                ? "border-[hsl(var(--team-blue))]/40 text-[hsl(var(--team-blue))] hover:bg-[hsl(var(--team-blue))]/10"
                : "border-[hsl(var(--team-red))]/40 text-[hsl(var(--team-red))] hover:bg-[hsl(var(--team-red))]/10"
            }`}
          >
            {isRed ? "الأزرق" : "الأحمر"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Room() {
  const params = useParams<{ code: string }>();
  const code = params.code?.toUpperCase();
  const [, setLocation] = useLocation();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<OnlineGameState | null>(null);
  const [myId, setMyId] = useState("");
  const [error, setError] = useState("");
  const [startError, setStartError] = useState("");

  useEffect(() => {
    const socket = getSocket();

    const init = () => {
      setMyId(socket.id ?? "");
      socket.emit("get-room", {}, (res: { error?: string; room?: RoomState }) => {
        if (res?.room) setRoom(res.room);
        else if (res?.error) setError(res.error);
      });
    };

    if (socket.connected) {
      init();
    } else {
      socket.once("connect", init);
    }

    socket.on("connect", () => setMyId(socket.id ?? ""));
    socket.on("room-updated", (r: RoomState) => setRoom(r));
    socket.on("game-updated", (g: OnlineGameState) => setGameState(g));

    return () => {
      socket.off("connect");
      socket.off("room-updated");
      socket.off("game-updated");
    };
  }, []);

  const me = room?.players.find((p) => p.id === myId);
  const isHost = me?.isHost ?? false;
  const isSpymaster = me?.isSpymaster ?? false;
  const myTeam = me?.team ?? null;

  const handleSetTeam = useCallback((team: Team) => {
    getSocket().emit("set-team", { team }, (res: { error?: string }) => {
      if (res?.error) setError(res.error);
    });
  }, []);

  const handleSetSpymaster = useCallback(() => {
    getSocket().emit("set-spymaster", {}, (res: { error?: string }) => {
      if (res?.error) setError(res.error);
    });
  }, []);

  const handleSetStartingTeam = useCallback((team: Team) => {
    getSocket().emit("set-starting-team", { team }, () => {});
  }, []);

  const handleStart = useCallback(() => {
    setStartError("");
    getSocket().emit("start-game", {}, (res: { error?: string }) => {
      if (res?.error) setStartError(res.error);
    });
  }, []);

  const handleClueSubmit = useCallback((word: string, count: number) => {
    getSocket().emit("give-clue", { word, count }, (res: { error?: string }) => {
      if (res?.error) setError(res.error);
    });
  }, []);

  const handleCardClick = useCallback((id: number) => {
    getSocket().emit("reveal-card", { cardId: id }, (res: { error?: string }) => {
      if (res?.error) setError(res.error);
    });
  }, []);

  const handlePassTurn = useCallback(() => {
    getSocket().emit("pass-turn", {}, (res: { error?: string }) => {
      if (res?.error) setError(res.error);
    });
  }, []);

  const handlePlayAgain = useCallback(() => {
    getSocket().emit("play-again", {}, (res: { error?: string }) => {
      if (res?.error) setError(res.error);
    });
    setGameState(null);
  }, []);

  if (!room) {
    if (error) {
      return (
        <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-destructive font-sans text-lg">{error}</p>
            <Button onClick={() => setLocation("/")} className="font-sans">رجوع للرئيسية</Button>
          </div>
        </div>
      );
    }
    return (
      <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground font-sans">جاري الاتصال...</p>
        </div>
      </div>
    );
  }

  const redPlayers = room.players.filter((p) => p.team === "red");
  const bluePlayers = room.players.filter((p) => p.team === "blue");
  const teamLabel = (team: Team) => team === "red" ? "الأحمر" : "الأزرق";

  if (room.status === "lobby") {
    return (
      <div dir="rtl" className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-2xl font-sans font-bold text-foreground">غرفة الانتظار</h1>
            <RoomCodeBadge code={code!} />
          </div>

          <p className="text-sm text-muted-foreground font-sans">
            شارك كود الغرفة مع أصحابك عشان يدخلوا — اضغط على اسمك تغير الفريق أو تبقى رئيس جواسيس
          </p>

          {error && <p className="text-destructive text-sm font-sans">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[hsl(var(--team-red))]/30">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--team-red))] shadow-[0_0_8px_rgba(229,57,53,0.5)]" />
                <h2 className="font-sans font-bold text-[hsl(var(--team-red))]">الفريق الأحمر ({redPlayers.length})</h2>
              </div>
              {redPlayers.map((p) => (
                <PlayerCard key={p.id} player={p} myId={myId} onSetSpymaster={handleSetSpymaster} onSetTeam={handleSetTeam} isLobby />
              ))}
              {redPlayers.length === 0 && <p className="text-xs text-muted-foreground font-sans text-center py-4">لا يوجد لاعبين</p>}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[hsl(var(--team-blue))]/30">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--team-blue))] shadow-[0_0_8px_rgba(30,136,229,0.5)]" />
                <h2 className="font-sans font-bold text-[hsl(var(--team-blue))]">الفريق الأزرق ({bluePlayers.length})</h2>
              </div>
              {bluePlayers.map((p) => (
                <PlayerCard key={p.id} player={p} myId={myId} onSetSpymaster={handleSetSpymaster} onSetTeam={handleSetTeam} isLobby />
              ))}
              {bluePlayers.length === 0 && <p className="text-xs text-muted-foreground font-sans text-center py-4">لا يوجد لاعبين</p>}
            </div>
          </div>

          {isHost && (
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-sans">الفريق اللي يبدأ:</label>
                <div className="flex gap-3">
                  {(["red", "blue"] as Team[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleSetStartingTeam(t)}
                      className={`flex-1 py-2 rounded-lg border-2 transition-all font-sans font-bold text-sm ${
                        room.startingTeam === t
                          ? t === "red"
                            ? "bg-[hsl(var(--team-red))] border-[hsl(var(--team-red))] text-white"
                            : "bg-[hsl(var(--team-blue))] border-[hsl(var(--team-blue))] text-white"
                          : "bg-transparent border-card-border text-muted-foreground"
                      }`}
                    >
                      {teamLabel(t)}
                    </button>
                  ))}
                </div>
              </div>
              {startError && <p className="text-destructive text-sm font-sans">{startError}</p>}
              <Button
                data-testid="button-start-game"
                onClick={handleStart}
                className="w-full h-12 font-sans font-bold text-base"
              >
                ابدأ اللعبة
              </Button>
            </div>
          )}
          {!isHost && (
            <p className="text-center text-sm text-muted-foreground font-sans">
              في انتظار الهوست يبدأ اللعبة...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isMyTurn = myTeam === gameState.currentTeam;
  const canReveal = isMyTurn && !isSpymaster && gameState.phase === "playing";
  const canGiveClue = isMyTurn && isSpymaster && gameState.phase === "spymaster-view";

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans overflow-hidden">
      <ScoreBarOnline room={room} gameState={gameState} myId={myId} />

      {gameState.phase === "spymaster-view" && (
        <div className={`w-full py-2 text-center font-sans font-bold text-sm text-white ${gameState.currentTeam === "red" ? "bg-[hsl(var(--team-red))]" : "bg-[hsl(var(--team-blue))]"}`}>
          {canGiveClue
            ? `شاشة رئيس الجواسيس — دورك تدي تلميح!`
            : `شاشة رئيس الجواسيس — الفريق ${teamLabel(gameState.currentTeam)}`}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border-b border-destructive/30 py-2 px-4 text-center text-sm text-destructive font-sans">
          {error}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row relative">
        <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 space-y-6">
          <Board
            cards={gameState.cards}
            phase={gameState.phase}
            onCardClick={canReveal ? handleCardClick : () => {}}
            isSpymaster={isSpymaster}
          />

          {canGiveClue && <SpymasterControls onSubmit={handleClueSubmit} />}

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
                {canReveal && (
                  <button
                    data-testid="button-pass-turn"
                    onClick={handlePassTurn}
                    className="px-4 py-2 border border-border rounded text-sm font-sans hover:bg-muted transition-colors"
                  >
                    تخطي الدور
                  </button>
                )}
                {!isMyTurn && (
                  <span className="text-xs text-muted-foreground font-sans px-3 py-1 rounded-full border border-border">
                    دور الفريق {teamLabel(gameState.currentTeam)}
                  </span>
                )}
              </div>
            </div>
          )}

          {gameState.phase === "spymaster-view" && !canGiveClue && (
            <div className="text-center text-sm text-muted-foreground font-sans px-4 py-2 rounded-lg border border-border">
              {isMyTurn ? "أنت رئيس الجواسيس — انتظر شاشة التلميح" : `في انتظار رئيس جواسيس الفريق ${teamLabel(gameState.currentTeam)}`}
            </div>
          )}
        </div>

        <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-r border-border bg-card/30 flex flex-col h-56 lg:h-auto">
          <GameLog log={gameState.log} />
        </div>
      </div>

      {gameState.phase === "game-over" && (
        <GameOver state={gameState} onPlayAgain={isHost ? handlePlayAgain : undefined} />
      )}
    </div>
  );
}

function ScoreBarOnline({ room, gameState, myId }: { room: RoomState; gameState: OnlineGameState; myId: string }) {
  const isPlaying = gameState.phase === "playing";
  const teamLabel = (t: string) => t === "red" ? "الأحمر" : "الأزرق";

  const redSpy = room.players.find((p) => p.team === "red" && p.isSpymaster)?.name ?? "";
  const blueSpy = room.players.find((p) => p.team === "blue" && p.isSpymaster)?.name ?? "";

  return (
    <div className="w-full bg-card border-b border-border p-3 flex items-center justify-between shadow-sm z-10 relative gap-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[hsl(var(--team-red))] shadow-[0_0_8px_rgba(229,57,53,0.6)] shrink-0" />
        <div className="font-sans flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-bold text-lg leading-none text-[hsl(var(--team-red))]">{gameState.redRemaining}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">الأحمر</span>
          </div>
          {redSpy && (
            <div className="flex items-center gap-1">
              <Crown className="w-2.5 h-2.5 text-[hsl(var(--team-red))]" />
              <span className="text-[10px] text-muted-foreground truncate max-w-[70px]">{redSpy}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center shrink-0">
        {isPlaying ? (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-sans text-muted-foreground mb-0.5 whitespace-nowrap">عملاء {teamLabel(gameState.currentTeam)} بيخمنوا</span>
            <div className={`px-3 py-1 rounded-full text-xs font-sans font-bold border ${gameState.currentTeam === "red" ? "bg-[hsl(var(--team-red))]/10 border-[hsl(var(--team-red))]/30 text-[hsl(var(--team-red))]" : "bg-[hsl(var(--team-blue))]/10 border-[hsl(var(--team-blue))]/30 text-[hsl(var(--team-blue))]"}`}>الدور شغال</div>
          </div>
        ) : gameState.phase === "spymaster-view" ? (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-sans text-muted-foreground mb-0.5 whitespace-nowrap">في انتظار التلميح</span>
            <div className="px-3 py-1 rounded-full text-xs font-sans font-bold bg-muted text-muted-foreground border border-border whitespace-nowrap">دور رئيس الجواسيس</div>
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full text-xs font-sans font-bold bg-muted text-muted-foreground border border-border">انتهت اللعبة</div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-row-reverse">
        <div className="w-3 h-3 rounded-full bg-[hsl(var(--team-blue))] shadow-[0_0_8px_rgba(30,136,229,0.6)] shrink-0" />
        <div className="font-sans flex flex-col items-end">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground hidden sm:inline">الأزرق</span>
            <span className="font-bold text-lg leading-none text-[hsl(var(--team-blue))]">{gameState.blueRemaining}</span>
          </div>
          {blueSpy && (
            <div className="flex items-center gap-1 flex-row-reverse">
              <Crown className="w-2.5 h-2.5 text-[hsl(var(--team-blue))]" />
              <span className="text-[10px] text-muted-foreground truncate max-w-[70px]">{blueSpy}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
