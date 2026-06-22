import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SpymasterControlsProps {
  onSubmit: (word: string, count: number) => void;
}

export default function SpymasterControls({ onSubmit }: SpymasterControlsProps) {
  const [word, setWord] = useState("");
  const [count, setCount] = useState("1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    const num = parseInt(count, 10);
    if (isNaN(num) || num < 0 || num > 9) return;
    onSubmit(word.trim(), num);
    setWord("");
    setCount("1");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-card-border p-6 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

      <div className="text-center z-10">
        <h3 className="font-sans font-bold text-sm text-muted-foreground mb-4">ابعت التلميح</h3>
      </div>

      <div className="flex gap-4 z-10">
        <div className="flex-1">
          <Input
            data-testid="input-clue-word"
            placeholder="كلمة واحدة بس"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="font-sans h-12 bg-background border-border text-center"
            autoComplete="off"
            spellCheck="false"
            maxLength={20}
            dir="rtl"
          />
        </div>
        <div className="w-24">
          <Input
            data-testid="input-clue-count"
            type="number"
            min="0"
            max="9"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="font-mono h-12 bg-background border-border text-center text-lg"
          />
        </div>
      </div>
      <Button
        data-testid="button-submit-clue"
        type="submit"
        className="h-12 font-sans font-bold tracking-widest z-10"
        disabled={!word.trim()}
      >
        ادي التلميح
      </Button>
    </form>
  );
}
