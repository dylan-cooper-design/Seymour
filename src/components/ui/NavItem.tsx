// NavItem — a single clickable row in the sidebar nav.
// Handles active/inactive visual states via the isActive prop.
// Pass an icon node to replace the placeholder square.

type NavItemProps = {
  label: string;
  isActive?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
};

export function NavItem({ label, isActive = false, icon, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 w-full items-center gap-2 rounded px-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-seymour-accent/60 ${
        isActive ? "bg-seymour-border" : "hover:bg-seymour-surface"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      {icon ?? (
        <span
          className="inline-block size-4 shrink-0 rounded border border-seymour-text/40"
          aria-hidden="true"
        />
      )}
      <span className={`text-label-sm ${isActive ? "text-seymour-accent" : "text-seymour-text"}`}>
        {label}
      </span>
    </button>
  );
}
