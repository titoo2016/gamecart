import { LogEntry } from "@/game/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal } from "lucide-react";

export default function GameLog({ log }: { log: LogEntry[] }) {
  return (
    <div className="flex flex-col h-full bg-card/50">
      <div className="p-4 border-b border-border flex items-center gap-2 text-muted-foreground">
        <Terminal className="w-4 h-4" />
        <h3 className="font-sans text-xs font-bold">سجل العملية</h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3 flex flex-col-reverse">
          {log.map((entry, i) => (
            <div key={i} className="text-sm font-sans flex items-start gap-3 opacity-80 hover:opacity-100 transition-opacity" dir="rtl">
              <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${entry.team === 'red' ? 'bg-[hsl(var(--team-red))]' : 'bg-[hsl(var(--team-blue))]'}`} />
              <div className="flex-1">
                {entry.type === "clue" && (
                  <div>
                    <span className="text-muted-foreground">تلميح: </span>
                    <strong className="text-foreground">{entry.text}</strong>
                  </div>
                )}
                {entry.type === "guess" && (
                  <div>
                    <span className="text-muted-foreground">اختار: </span>
                    <span className="text-foreground">{entry.text}</span>
                  </div>
                )}
                {entry.type === "pass" && (
                  <span className="text-muted-foreground italic">{entry.text}</span>
                )}
              </div>
            </div>
          ))}
          {log.length === 0 && (
            <div className="text-xs text-muted-foreground font-sans text-center mt-4">محدش عمل حاجة لسه...</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
