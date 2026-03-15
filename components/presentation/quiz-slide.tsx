"use client";

import { motion } from "framer-motion";

import type { QuizSlide as QuizSlideType } from "@/components/presentation/types";
import type { RealtimeQuestionState } from "@/lib/realtime/protocol";

type QuizSlideProps = {
  slide: QuizSlideType;
  index: number;
  total: number;
  isDark: boolean;
  selectedId: string | null;
  revealed: boolean;
  liveQuestion: RealtimeQuestionState | null;
  participantCount: number;
  countdownSecondsRemaining: number | null;
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
  liveQuestion,
  participantCount,
  countdownSecondsRemaining,
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
  const correctLiveVotes = liveQuestion?.totals[slide.correctAnswer] ?? 0;
  const correctLivePercent = liveQuestion?.totalVotes
    ? Math.round((correctLiveVotes / liveQuestion.totalVotes) * 100)
    : 0;
  const revealBannerVisible = liveQuestion?.status === "revealed";
  const correctOption = slide.answers.find((option) => option.id === slide.correctAnswer);
  const votedCount = liveQuestion?.totalVotes ?? 0;
  const votingOpen = liveQuestion?.status === "open";

  return (
    <div className="relative grid h-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <motion.div
        initial={false}
        animate={{
          opacity: revealBannerVisible ? 1 : 0,
          y: revealBannerVisible ? 0 : 18,
          scale: revealBannerVisible ? 1 : 0.98,
          pointerEvents: revealBannerVisible ? "auto" : "none",
        }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className={`absolute inset-0 z-40 flex items-center justify-center ${
          isDark ? "bg-black/86 text-[#d6ff35]" : "bg-[#d6ff35]/92 text-black"
        }`}
      >
        <div
          className={`mx-auto grid w-full max-w-6xl gap-6 px-8 py-8 md:px-12 lg:grid-cols-[0.95fr_1.05fr] ${
            isDark
              ? "text-[#d6ff35]"
              : "text-black"
          }`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-65">
              Reveal stats
            </p>
            <p className="mt-4 font-display text-[4rem] uppercase leading-[0.88] tracking-[-0.06em] md:text-[5.5rem] lg:text-[6.6rem]">
              {correctLivePercent}% got it right
            </p>
            <p className="mt-4 text-lg uppercase tracking-[0.18em] opacity-75 md:text-xl">
              {correctLiveVotes} of {liveQuestion?.totalVotes ?? 0} voters picked the right answer
            </p>
          </div>

          <div
            className={`rounded-[2rem] border-2 px-6 py-6 shadow-[12px_12px_0_rgba(0,0,0,0.16)] ${
              isDark ? "border-[#d6ff35] bg-[#d6ff35] text-black" : "border-black bg-black text-[#d6ff35]"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-65">
              Correct answer
            </p>
            <p className="mt-4 font-display text-2xl uppercase leading-none tracking-[0.02em] md:text-3xl">
              {slide.correctAnswer}
            </p>
            <p className="mt-3 text-2xl leading-tight md:text-3xl">
              {correctOption?.label}
            </p>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] opacity-65">
              Core concept
            </p>
            <p className="mt-2 text-lg leading-snug md:text-xl">{slide.correctConcept}</p>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] opacity-65">
              Why it matters
            </p>
            <p className="mt-2 text-base leading-relaxed md:text-lg">{slide.explanation}</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          opacity: countdownSecondsRemaining ? 1 : 0,
          scale: countdownSecondsRemaining ? 1 : 0.98,
          pointerEvents: "none",
        }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className={`absolute inset-0 z-30 flex items-center justify-center ${
          isDark ? "bg-black/76 text-[#d6ff35]" : "bg-[#d6ff35]/82 text-black"
        }`}
      >
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] opacity-70">
            All votes in
          </p>
          <p className="mt-4 font-display text-[7rem] uppercase leading-none tracking-[-0.08em] md:text-[9rem] lg:text-[11rem]">
            {countdownSecondsRemaining ?? ""}
          </p>
          <p className="mt-4 text-2xl uppercase tracking-[0.18em] opacity-82 md:text-3xl">
            Revealing answer
          </p>
        </div>
      </motion.div>
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
            <h2 className="font-display text-6xl uppercase leading-[0.9] tracking-[-0.02em] md:text-7xl lg:text-[6.8rem]">
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

        {liveQuestion ? (
          <div
            className={`rounded-[1.8rem] border-2 px-5 py-5 ${
              isDark ? "border-[#d6ff35]/18 bg-white/6 text-[#d6ff35]" : "border-black/18 bg-white/35 text-black"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-60">
                  Live vote progress
                </p>
                <p className="mt-2 font-display text-4xl uppercase leading-none tracking-[-0.05em] md:text-5xl">
                  {votedCount}/{participantCount}
                </p>
              </div>
              <div className="text-right text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                <p>{liveQuestion.status}</p>
                <p>{participantCount} expected</p>
              </div>
            </div>
            <p className="mt-4 text-lg leading-snug opacity-82">
              {votingOpen
                ? countdownSecondsRemaining
                  ? "Everyone is in. Quick pause for last-second changes before reveal."
                  : "Waiting for the room to finish voting. The answer will reveal once everyone is in."
                : "Voting is closed. Reveal stats are on screen now."}
            </p>
          </div>
        ) : null}

      </div>

      <div className="flex h-full flex-col justify-between gap-6">
        <div className="space-y-4">
          {slide.answers.map((option, optionIndex) => {
            const isSelected = selectedId === option.id;
            const isCorrect = option.id === slide.correctAnswer;
            const showCorrect = revealed && isCorrect;
            const showIncorrect = revealed && isSelected && !isCorrect;
            const liveVotes = liveQuestion?.totals[option.id] ?? 0;
            const livePercent = liveQuestion?.totalVotes
              ? Math.round((liveVotes / liveQuestion.totalVotes) * 100)
              : 0;
            const shouldShowLiveResults = liveQuestion?.status === "revealed";

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
                      {option.id}
                    </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-xl leading-tight md:text-2xl">{option.label}</p>
                      {shouldShowLiveResults ? (
                        <div className="shrink-0 text-right text-xs font-semibold uppercase tracking-[0.2em] opacity-75">
                          <p>{liveVotes}</p>
                          <p>{livePercent}%</p>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-75">
                        Choice {optionIndex + 1}
                      </p>
                      {isSelected && !revealed ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-75">
                          Your pick
                        </p>
                      ) : null}
                    </div>
                    {shouldShowLiveResults ? (
                      <div className={`h-2 overflow-hidden rounded-full ${showCorrect ? "bg-[#d6ff35]/18" : isDark ? "bg-white/10" : "bg-black/10"}`}>
                        <div
                          className={`h-full rounded-full ${showCorrect ? "bg-[#d6ff35]" : isDark ? "bg-[#d6ff35]" : "bg-black"}`}
                          style={{ width: `${livePercent}%` }}
                        />
                      </div>
                    ) : null}
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
