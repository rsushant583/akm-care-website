import { cn } from "@/lib/utils";

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "text-[0.65rem] sm:text-xs font-semibold tracking-[0.22em] uppercase text-[#E8621A]",
        className,
      )}
    >
      {children}
    </p>
  );
}
