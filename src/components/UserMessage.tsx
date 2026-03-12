type UserMessageProps = {
  text: string;
};

export function UserMessage({ text }: UserMessageProps) {
  return (
    <div className="flex w-full justify-end">
      <div className="max-w-bubble rounded border border-seymour-accent bg-seymour-surface-2 px-4 py-2">
        <p className="whitespace-pre-wrap text-left text-body-sm text-seymour-text">
          {text}
        </p>
      </div>
    </div>
  );
}
