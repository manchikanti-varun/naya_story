import { getPasswordStrength, type PasswordStrength } from "@/lib/auth-form";
import { cn } from "@/lib/cn";

const LABELS: Record<PasswordStrength, string> = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

const BAR: Record<PasswordStrength, number> = {
  weak: 1,
  fair: 2,
  good: 3,
  strong: 4,
};

const COLOR: Record<PasswordStrength, string> = {
  weak: "bg-red-400",
  fair: "bg-amber-400",
  good: "bg-gold",
  strong: "bg-emerald-500",
};

type Props = { password: string };

export function PasswordStrengthHint({ password }: Props) {
  if (!password) return null;
  const strength = getPasswordStrength(password);
  const filled = BAR[strength];

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= filled ? COLOR[strength] : "bg-ivory-deep",
            )}
          />
        ))}
      </div>
      <p className="font-sans text-xs text-ink-soft">
        Password strength: <span className="text-ink-muted">{LABELS[strength]}</span>
        {strength === "weak" || strength === "fair" ? (
          <span> — use 10+ characters with letters, numbers, and symbols.</span>
        ) : null}
      </p>
    </div>
  );
}
