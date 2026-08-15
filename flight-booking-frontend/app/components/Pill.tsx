'use client';

export default function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-[18px] py-2.5 text-sm cursor-pointer min-h-[44px] text-left border transition-colors ${
        active
          ? 'bg-accent border-accent text-page'
          : 'bg-transparent border-border-input text-ink-secondary hover:border-accent'
      }`}
    >
      {children}
    </button>
  );
}
