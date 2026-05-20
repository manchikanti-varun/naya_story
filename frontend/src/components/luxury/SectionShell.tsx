import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  tone?: "ivory" | "mist" | "sand" | "ink";
  id?: string;
  compact?: boolean;
};

const tones = {
  ivory: "bg-ivory",
  mist: "bg-ivory-muted/75",
  sand: "bg-gradient-to-b from-ivory-soft to-ivory",
  ink: "bg-ink text-ivory",
};

export function SectionShell({
  children,
  className,
  tone = "ivory",
  id,
  compact = false,
}: Props) {
  return (
    <section
      id={id}
      className={cn(
        compact ? "py-16 md:py-20" : "py-section",
        tones[tone],
        className,
      )}
    >
      <div className="lux-shell">{children}</div>
    </section>
  );
}
