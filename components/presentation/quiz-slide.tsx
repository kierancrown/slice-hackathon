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
  votedParticipantNames: string[];
  sessionCode: string | null;
  liveConnected: boolean;
  onLiveReveal?: () => void;
  onLiveReset?: () => void;
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
  votedParticipantNames,
  sessionCode,
  liveConnected,
  onLiveReveal,
  onLiveReset,
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
  const participationCardClass = isDark
    ? "border-[#d6ff35]/18 bg-white/6 text-[#d6ff35]"
    : "border-black/18 bg-white/35 text-black";
  const correctLiveVotes = liveQuestion?.totals[slide.answerId] ?? 0;
  const correctLivePercent = liveQuestion?.totalVotes
    ? Math.round((correctLiveVotes / liveQuestion.totalVotes) * 100)
    : 0;
  const revealBannerVisible = liveQuestion?.status === "revealed";

  return (
    <div className="relative grid h-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <motion.div
        initial={false}
        animate={{
          opacity: revealBannerVisible ? 1 : 0,
          y: revealBannerVisible ? 0 : -18,
          scale: revealBannerVisible ? 1 : 0.96,
          pointerEvents: revealBannerVisible ? "auto" : "none",
        }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className={`absolute left-1/2 top-0 z-30 w-full max-w-2xl -translate-x-1/2 rounded-[1.8rem] border-2 px-6 py-5 shadow-[12px_12px_0_rgba(0,0,0,0.16)] ${
          isDark ? "border-[#d6ff35] bg-[#d6ff35] text-black" : "border-black bg-black text-[#d6ff35]"
        }`}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">
              Reveal stats
            </p>
            <p className="mt-2 font-display text-4xl uppercase leading-none tracking-[-0.05em] md:text-5xl">
              {correctLivePercent}% got it right
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.18em] opacity-75">
              {correctLiveVotes} of {liveQuestion?.totalVotes ?? 0} voters picked the right answer
            </p>
          </div>
          <div className="text-right text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
            <p>{liveQuestion?.totalVotes ?? 0} votes</p>
            <p>Answer {slide.answerId.toUpperCase()}</p>
          </div>
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

        {sessionCode ? (
          <div className={`rounded-[1.8rem] border px-5 py-5 ${participationCardClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-60">
                  Live participation
                </p>
                <p className="mt-2 font-display text-3xl uppercase leading-none tracking-[-0.05em]">
                  {participantCount} joined
                </p>
              </div>
              <div className="text-right text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                <p>{liveConnected ? "Connected" : "Connecting"}</p>
                <p>{sessionCode}</p>
              </div>
            </div>

            {liveQuestion ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.2em] opacity-65">
                  <span>{liveQuestion.totalVotes} votes</span>
                  <span>{liveQuestion.status}</span>
                </div>
                {votedParticipantNames.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-58">
                      Voted so far
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {votedParticipantNames.map((name) => (
                        <span
                          key={name}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                            isDark
                              ? "border-[#d6ff35]/18 bg-black/20 text-[#d6ff35]"
                              : "border-black/14 bg-white/55 text-black"
                          }`}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <p className="text-sm leading-relaxed opacity-78">
                  Votes update directly in the answer cards on the right. Reveal or reset the live question from here.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onLiveReveal}
                    className={`rounded-full border-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                      isDark
                        ? "border-[#d6ff35] bg-[#d6ff35] text-black"
                        : "border-black bg-black text-[#d6ff35]"
                    }`}
                  >
                    Reveal live
                  </button>
                  <button
                    type="button"
                    onClick={onLiveReset}
                    className={`rounded-full border-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                      isDark
                        ? "border-[#d6ff35]/20 text-[#d6ff35]"
                        : "border-black/20 text-black"
                    }`}
                  >
                    Reset live
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-relaxed opacity-78">
                Start a live session and move onto this slide to capture votes in realtime.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex h-full flex-col justify-between gap-6">
        <div className="space-y-4">
          {slide.options.map((option, optionIndex) => {
            const isSelected = selectedId === option.id;
            const isCorrect = option.id === slide.answerId;
            const showCorrect = revealed && isCorrect;
            const showIncorrect = revealed && isSelected && !isCorrect;
            const liveVotes = liveQuestion?.totals[option.id] ?? 0;
            const livePercent = liveQuestion?.totalVotes
              ? Math.round((liveVotes / liveQuestion.totalVotes) * 100)
              : 0;
            const shouldShowLiveResults = Boolean(liveQuestion);

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
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-xl leading-tight md:text-2xl">{option.text}</p>
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
