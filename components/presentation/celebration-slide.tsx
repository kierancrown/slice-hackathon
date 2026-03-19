"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { motion } from "framer-motion";

import type { ClosingSlide } from "@/components/presentation/types";

type CelebrationSlideProps = {
  slide: ClosingSlide;
  index: number;
  total: number;
  isDark: boolean;
};

export function CelebrationSlide({
  slide,
  index,
  total,
  isDark,
}: CelebrationSlideProps) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[2.4rem] border-2 border-black/85 bg-[radial-gradient(circle_at_top,#fff6a3_0%,#d6ff35_28%,#97d11b_62%,#111111_100%)] p-8 text-black shadow-[16px_16px_0_rgba(0,0,0,0.18)] md:p-12">
      <Confetti
        width={viewport.width}
        height={viewport.height}
        recycle
        numberOfPieces={220}
        gravity={0.14}
        initialVelocityY={11}
        className="pointer-events-none !fixed inset-0 z-0"
        colors={["#d6ff35", "#111111", "#ff6eb4", "#ffffff", "#2d7ff9"]}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 flex items-start justify-between gap-6"
      >
        <div className="inline-flex rounded-full border-2 border-black/85 bg-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
          {slide.eyebrow ?? "That’s a wrap"}
        </div>
        <div
          className={`inline-flex rounded-full border-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${
            isDark ? "border-black/85 bg-black text-[#d6ff35]" : "border-black/85 bg-white/40"
          }`}
        >
          {index + 1}/{total}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08 }}
        className="relative z-10 max-w-5xl space-y-6"
      >
        <h2 className="font-display text-[4.5rem] uppercase leading-[0.88] tracking-[-0.06em] md:text-[7rem] lg:text-[8.6rem]">
          {slide.title}
        </h2>
        {slide.body ? (
          <p className="max-w-3xl text-xl leading-[1.08] text-black/82 md:text-3xl">
            {slide.body}
          </p>
        ) : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.14 }}
        className="relative z-10 max-w-2xl rounded-[1.8rem] border-2 border-black/85 bg-black px-6 py-5 text-[#d6ff35] shadow-[10px_10px_0_rgba(0,0,0,0.16)]"
      >
        <p className="text-sm uppercase tracking-[0.22em] text-[#d6ff35]/62">Final note</p>
        <p className="mt-3 text-2xl leading-tight md:text-3xl">{slide.kicker}</p>
      </motion.div>
    </div>
  );
}
