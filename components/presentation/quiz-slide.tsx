"use client";

import { motion } from "framer-motion";

import type { QuizSlide as QuizSlideType } from "@/components/presentation/types";

type QuizSlideProps = {
  slide: QuizSlideType;
  index: number;
  total: number;
  isDark: boolean;
  selectedId: string | null;
  revealed: boolean;
  onSelect: (optionId: string) => void;
  onReveal: () => void;
};

export function QuizSlide({
  slide,
  index,
  total,
  isDark,
  selectedId,
  revealed,
  onSelect,
  onReveal,
}: QuizSlideProps) {
  const mutedTextClass = isDark ? "text-[#d6ff35]/68" : "text-black/65";
  const lineClass = isDark ? "bg-[#d6ff35]/30" : "bg-black/30";
  const promptClass = isDark ? "text-[#d6ff35]/82" : "text-black/72";
  const hintClass = isDark
    ? "border-[#d6ff35]/15 bg-white/8 text-[#d6ff35]/72"
    : "border-black/15 bg-white/35 text-black/55";
  const revealDisabledClass = isDark
    ? "disabled:border-[#d6ff35]/20 disabled:bg-[#d6ff35]/10 disabled:text-[#d6ff35]/35"
    : "disabled:border-black/20 disabled:bg-black/20 disabled:text-black/35";

  return (
    <div className="grid h-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col justify-between gap-8">
        <div className="space-y-6">
          <div className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] ${mutedTextClass}`}>
            <span>{slide.eyebrow}</span>
            <span className={`h-px w-12 ${lineClass}`} />
            <span>
              {index + 1}/{total}
            </span>
          </div>
          <div className="max-w-4xl space-y-5">
            <h2 className="font-display text-6xl uppercase leading-[0.86] tracking-[-0.06em] md:text-7xl lg:text-[6.8rem]">
              {slide.title}
            </h2>
            <p className={`max-w-2xl text-xl leading-tight md:text-2xl ${promptClass}`}>
              {slide.prompt}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onReveal}
            disabled={!selectedId}
            className={`inline-flex min-w-40 items-center justify-center rounded-full border-2 border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#d6ff35] transition hover:-translate-y-0.5 hover:bg-[#161616] disabled:cursor-not-allowed ${revealDisabledClass}`}
          >
            {revealed ? "Revealed" : "Reveal answer"}
          </button>
          <p className={`rounded-full border-2 px-4 py-2 text-sm uppercase tracking-[0.18em] ${hintClass}`}>
            Select first, then reveal.
          </p>
        </div>
      </div>

      <div className="flex h-full flex-col justify-between gap-6">
        <div className="space-y-4">
          {slide.options.map((option, optionIndex) => {
            const isSelected = selectedId === option.id;
            const isCorrect = option.id === slide.answerId;
            const showCorrect = revealed && isCorrect;
            const showIncorrect = revealed && isSelected && !isCorrect;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                className={`group w-full rounded-[1.6rem] border-2 px-6 py-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black ${
                  showCorrect
                    ? "border-black bg-black text-[#d6ff35] shadow-[10px_10px_0_rgba(0,0,0,0.16)]"
                    : showIncorrect
                      ? "border-black bg-[#d6ff35] text-black shadow-[10px_10px_0_rgba(0,0,0,0.1)]"
                      : isSelected
                        ? "border-black bg-[#d6ff35] text-black shadow-[10px_10px_0_rgba(0,0,0,0.1)]"
                        : "border-black/20 bg-[#d6ff35] text-black hover:border-black hover:bg-[#d9ff57]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.8rem] border-2 border-current font-display text-xl leading-none uppercase">
                    {option.label}
                  </span>
                  <div className="space-y-2">
                    <p className="text-xl leading-tight md:text-2xl">{option.text}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-75">
                      Choice {optionIndex + 1}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <motion.div
          initial={false}
          animate={{
            opacity: revealed ? 1 : 0,
            y: revealed ? 0 : 16,
          }}
          className="min-h-36 rounded-[1.8rem] border-2 border-black bg-black px-6 py-5 text-[#d6ff35] shadow-[10px_10px_0_rgba(0,0,0,0.16)]"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#d6ff35]/70">
            Explanation
          </p>
          <p className="max-w-xl text-lg leading-snug md:text-xl">{slide.explanation}</p>
        </motion.div>
      </div>
    </div>
  );
}
