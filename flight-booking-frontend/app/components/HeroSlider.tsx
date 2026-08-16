'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

interface Slide {
  src: string;
  alt: string;
}

export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // State, not a ref, since it's read during render below (the transition
  // duration) - a ref wouldn't trigger a re-render once matchMedia resolves,
  // so the very first slide's fade-in would always ignore the user's actual
  // reduced-motion preference.
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [paused, reducedMotion, slides.length]);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.9, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <Image
            src={slides[index].src}
            alt={slides[index].alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(18,22,24,0.42) 0%, rgba(18,22,24,0.08) 42%, rgba(18,22,24,0.72) 100%)' }}
      />

      {slides.length > 1 && (
        <div className="absolute bottom-5 right-5 sm:bottom-7 sm:right-7 z-10 flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="w-9 h-9 rounded-full border border-page/40 text-page flex items-center justify-center hover:bg-page/15 transition-colors"
          >
            ←
          </button>
          <div className="flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-page' : 'bg-page/40'}`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="w-9 h-9 rounded-full border border-page/40 text-page flex items-center justify-center hover:bg-page/15 transition-colors"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
