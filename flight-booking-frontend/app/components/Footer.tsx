export default function Footer() {
  return (
    <footer className="border-t border-border px-4 sm:px-8 lg:px-14 py-10 sm:py-13 bg-band mt-auto">
      <div className="max-w-6xl mx-auto grid gap-7" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div>
          <div className="font-serif text-[22px] mb-2.5">AeroGlide</div>
          <div className="text-[13px] text-ink-muted leading-[1.7] max-w-[26ch]">
            Fare search and 24-hour price holds across 400 airlines.
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-xs tracking-[0.12em] uppercase text-ink-muted mb-1">Book</span>
          <a href="/" className="text-accent hover:text-accent-hover">Flights</a>
          <a href="/bookings" className="text-accent hover:text-accent-hover">Manage booking</a>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-xs tracking-[0.12em] uppercase text-ink-muted mb-1">Support</span>
          <a href="#" className="text-accent hover:text-accent-hover">Help centre</a>
          <a href="#" className="text-accent hover:text-accent-hover">Baggage</a>
          <a href="#" className="text-accent hover:text-accent-hover">Refunds</a>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-xs tracking-[0.12em] uppercase text-ink-muted mb-1">Company</span>
          <a href="#" className="text-accent hover:text-accent-hover">About</a>
          <a href="#" className="text-accent hover:text-accent-hover">Careers</a>
          <a href="#" className="text-accent hover:text-accent-hover">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
