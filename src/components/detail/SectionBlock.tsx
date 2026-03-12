import { SectionLabel } from "@/components/ui/SectionLabel";
import type { DetailSection } from "@/types/navigation";

export function SectionBlock({ label, content }: DetailSection) {
  return (
    <div className="flex flex-col gap-1">
      <SectionLabel>{label}</SectionLabel>
      {Array.isArray(content) ? (
        <ul className="list-disc pl-5">
          {content.map((item, i) => (
            <li key={i} className="text-body-sm text-seymour-text">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-seymour-text">{content}</p>
      )}
    </div>
  );
}
