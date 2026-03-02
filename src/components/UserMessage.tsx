type UserMessageProps = {
  text: string;
};

export function UserMessage({ text }: UserMessageProps) {
  return (
    <div className="flex w-full justify-end">
      <div className="max-w-bubble rounded-3xl border border-seymour-accent bg-seymour-surface-2 px-6 py-4">
        <p className="whitespace-pre-wrap text-center text-body-sm text-seymour-text">
          {text}
        </p>
      </div>
    </div>
  );
}
