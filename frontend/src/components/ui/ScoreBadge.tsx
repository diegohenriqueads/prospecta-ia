interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

function classify(score: number): { label: string; color: string; ring: string } {
  if (score >= 55) {
    return { label: "Alta oportunidade", color: "text-opportunity-high", ring: "ring-opportunity-high/25 bg-opportunity-high/10" };
  }
  if (score >= 25) {
    return { label: "Oportunidade média", color: "text-opportunity-mid", ring: "ring-opportunity-mid/25 bg-opportunity-mid/10" };
  }
  return { label: "Baixa oportunidade", color: "text-opportunity-low", ring: "ring-opportunity-low/25 bg-opportunity-low/10" };
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
};

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const { color, ring } = classify(score);
  return (
    <div
      className={`flex ${SIZE_CLASSES[size]} shrink-0 items-center justify-center rounded-full font-mono font-semibold ring-1 ${ring} ${color}`}
      title={`Score de oportunidade: ${score}/100`}
    >
      {score}
    </div>
  );
}

export function scoreLabel(score: number): string {
  return classify(score).label;
}
