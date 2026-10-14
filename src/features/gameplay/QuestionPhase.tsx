import type { GamePhase } from "@/features/quiz/types";
import { QuestionCard } from "./QuestionCard";
export function QuestionPhase({
  game,
  selected,
  pending,
  onSelect,
  onSubmit,
}: {
  game: GamePhase<"question">;
  selected: number | null;
  pending: boolean;
  onSelect: (id: number) => void;
  onSubmit: () => void;
}) {
  const { question } = game;
  return (
    <QuestionCard
      category={game.category.name}
      progress={`${question.index + 1}/${game.total}`}
      question={question.text}
      options={question.options.map((a) => ({ id: a.id, label: a.text }))}
      selectedId={selected}
      disabled={pending}
      onSelect={onSelect}
      next={{
        onClick: onSubmit,
        disabled: pending || selected === null,
        label: "Next",
      }}
    />
  );
}
