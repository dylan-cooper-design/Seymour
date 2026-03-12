type DetailHeaderProps = {
  title: string;
};

export function DetailHeader({ title }: DetailHeaderProps) {
  return (
    <h2 className="text-header font-semibold text-seymour-white">{title}</h2>
  );
}
