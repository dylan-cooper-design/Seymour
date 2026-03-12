// Caps Label / 10px — mirrors the "Caps Label/10px" Figma text style.
// Used for section headers throughout the nav and dropdowns.

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-wide text-seymour-text/50">
      {children}
    </p>
  );
}
