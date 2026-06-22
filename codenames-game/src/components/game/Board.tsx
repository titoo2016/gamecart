import { Card as CardType, GamePhase } from "@/game/types";
import Card from "./Card";

interface BoardProps {
  cards: CardType[];
  phase: GamePhase;
  onCardClick: (id: number) => void;
  isSpymaster: boolean;
}

export default function Board({ cards, phase, onCardClick, isSpymaster }: BoardProps) {
  const isPlaying = phase === "playing";

  return (
    <div className="grid grid-cols-5 gap-2 md:gap-4 w-full max-w-4xl mx-auto aspect-[5/4] md:aspect-[5/3]">
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          isSpymaster={isSpymaster}
          isClickable={isPlaying && !card.revealed && !isSpymaster}
          onClick={() => onCardClick(card.id)}
        />
      ))}
    </div>
  );
}
