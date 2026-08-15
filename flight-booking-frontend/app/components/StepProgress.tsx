const STEPS = ['Select flight', 'Passengers', 'Payment', 'Confirmed'];

export default function StepProgress({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex gap-2.5 sm:gap-5 flex-wrap items-center mb-6.5 mb-[26px]">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs shrink-0 ${
              i <= activeIndex ? 'bg-accent text-page' : 'border border-border-input text-ink-faint'
            }`}
          >
            {i + 1}
          </span>
          <span className={`text-sm whitespace-nowrap ${i <= activeIndex ? 'text-ink' : 'text-ink-faint'}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}
