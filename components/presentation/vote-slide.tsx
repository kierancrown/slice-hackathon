"use client";

import { motion } from "framer-motion";

import type { VotingSlide as VotingSlideType } from "@/components/presentation/types";
import type { RealtimeQuestionState } from "@/lib/realtime/protocol";

type VoteSlideProps = {
  slide: VotingSlideType;
  index: number;
  total: number;
  isDark: boolean;
  liveQuestion: RealtimeQuestionState | null;
  participantCount: number;
};

export function VoteSlide({
  slide,
  index,
  total,
  isDark,
  liveQuestion,
  participantCount,
}: VoteSlideProps) {
  const mutedTextClass = isDark ? "text-[#d6ff35]/68" : "text-black/65";
  const lineClass = isDark ? "bg-[#d6ff35]/30" : "bg-black/30";
  const promptClass = isDark ? "text-[#d6ff35]/82" : "text-black/72";
  const limePanelClass =
    "border-2 border-black/85 bg-[#d6ff35] text-black shadow-[10px_10px_0_rgba(0,0,0,0.1)]";
  const darkPanelClass =
    "border-2 border-black/90 bg-[#111111] text-[#d6ff35] shadow-[10px_10px_0_rgba(0,0,0,0.16)]";
  const votedCount = liveQuestion?.totalVotes ?? 0;
  const votingOpen = liveQuestion?.status === "open";
  const revealed = liveQuestion?.status === "revealed";
  const winningOption = revealed
    ? slide.voting.options.reduce<(typeof slide.voting.options)[number] | null>((winner, option) => {
        const winnerVotes = winner ? liveQuestion?.totals[winner.id] ?? 0 : -1;
        const optionVotes = liveQuestion?.totals[option.id] ?? 0;
        return optionVotes > winnerVotes ? option : winner;
      }, null)
    : null;
  const winningVotes = winningOption ? liveQuestion?.totals[winningOption.id] ?? 0 : 0;
  const winningPercent =
    revealed && liveQuestion?.totalVotes
      ? Math.round((winningVotes / liveQuestion.totalVotes) * 100)
      : 0;

  return (
    <div className="relative grid h-full gap-8 lg:grid-cols-[1fr_0.98fr]">
      <motion.div
        initial={false}
        animate={{
          opacity: revealed ? 1 : 0,
          y: revealed ? 0 : 18,
          scale: revealed ? 1 : 0.98,
          pointerEvents: revealed ? "auto" : "none",
        }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className={`absolute inset-0 z-40 flex items-center justify-center ${
          isDark ? "bg-black/88 text-[#d6ff35]" : "bg-[#d6ff35]/92 text-black"
        }`}
      >
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-8 py-8 md:px-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-65">
              Vote reveal
            </p>
            <p className="mt-4 font-display text-[4rem] uppercase leading-[0.88] tracking-[-0.06em] md:text-[5.5rem] lg:text-[6.6rem]">
              {winningPercent}% backed the winner
            </p>
            <p className="mt-4 text-lg uppercase tracking-[0.18em] opacity-75 md:text-xl">
              {winningVotes} of {liveQuestion?.totalVotes ?? 0} voters picked the top team
            </p>
          </div>

          <div
            className={`rounded-[2rem] border-2 px-6 py-6 shadow-[12px_12px_0_rgba(0,0,0,0.16)] ${
              isDark ? "border-[#d6ff35] bg-[#d6ff35] text-black" : "border-black bg-black text-[#d6ff35]"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-65">
              {slide.voting.revealLabel}
            </p>
            <p className="mt-4 font-display text-3xl uppercase leading-none tracking-[0.02em] md:text-4xl">
              {winningOption?.label ?? "Awaiting result"}
            </p>
            {winningOption?.detail ? (
              <p className="mt-3 text-xl leading-tight md:text-2xl">{winningOption.detail}</p>
            ) : null}
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] opacity-65">
              Total support
            </p>
            <p className="mt-2 text-lg leading-snug md:text-xl">
              {winningVotes} votes. {winningPercent}% of the room.
            </p>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] opacity-65">
              Next
            </p>
            <p className="mt-2 text-base leading-relaxed md:text-lg">
              Wrap the demos, call the winning team, and close the session cleanly.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col justify-between gap-8">
        <div className="space-y-6">
          <div className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] ${mutedTextClass}`}>
            <span>{slide.eyebrow ?? "Voting"}</span>
            <span className={`h-px w-12 ${lineClass}`} />
            <span>
              {index + 1}/{total}
            </span>
          </div>
          <div className="max-w-4xl space-y-5">
            <h2 className="font-display text-6xl uppercase leading-[0.9] tracking-[-0.02em] md:text-7xl lg:text-[6.2rem]">
              {slide.title}
            </h2>
            <p className={`max-w-2xl text-xl leading-tight md:text-2xl ${promptClass}`}>
              {slide.intro}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {slide.items.map((item, itemIndex) => (
            <div key={item} className={`${darkPanelClass} rounded-[1.5rem] px-5 py-4`}>
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.8rem] border-2 border-[#d6ff35]/28 font-display text-2xl leading-none">
                  {itemIndex + 1}
                </span>
                <p className="pt-1 text-lg leading-snug md:text-xl">{item}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`${limePanelClass} rounded-[1.8rem] px-5 py-5`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/55">
                Live vote progress
              </p>
              <p className="mt-2 font-display text-4xl uppercase leading-none tracking-[-0.05em] md:text-5xl">
                {votedCount}/{participantCount}
              </p>
            </div>
            <div className="text-right text-xs font-semibold uppercase tracking-[0.2em] text-black/65">
              <p>{revealed ? "revealed" : votingOpen ? "open" : "ready"}</p>
              <p>{participantCount} expected</p>
            </div>
          </div>
          <p className="mt-4 text-lg leading-snug text-black/82">
            {revealed
              ? "Winner is on screen."
              : votingOpen
                ? "Phones are live. Once everyone has voted, the winning team reveals automatically."
                : slide.voting.prompt}
          </p>
        </div>
      </div>

      <div className="flex h-full flex-col justify-between gap-6">
        <div className="space-y-4">
          {slide.voting.options.map((option) => {
            const liveVotes = liveQuestion?.totals[option.id] ?? 0;
            const livePercent = liveQuestion?.totalVotes
              ? Math.round((liveVotes / liveQuestion.totalVotes) * 100)
              : 0;

            return (
              <div key={option.id} className={`${limePanelClass} rounded-[1.6rem] px-6 py-5`}>
                <div className="flex items-start gap-4">
                  <span className="mt-1 inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-[0.8rem] border-2 border-current px-3 font-display text-base leading-none uppercase">
                    {option.id.replace("TEAM", "T")}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-2xl leading-tight md:text-[2rem]">{option.label}</p>
                        {option.detail ? (
                          <p className="mt-2 text-sm uppercase tracking-[0.18em] text-black/62">
                            {option.detail}
                          </p>
                        ) : null}
                      </div>
                      {revealed ? (
                        <div className="shrink-0 text-right text-xs font-semibold uppercase tracking-[0.2em] opacity-75">
                          <p>{liveVotes}</p>
                          <p>{livePercent}%</p>
                        </div>
                      ) : null}
                    </div>
                    {revealed ? (
                      <div className="h-2 overflow-hidden rounded-full bg-black/12">
                        <div
                          className="h-full rounded-full bg-black"
                          style={{ width: `${livePercent}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {slide.footer ? (
          <div className={`${darkPanelClass} min-h-36 rounded-[1.8rem] px-6 py-5`}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#d6ff35]/70">
              Presenter note
            </p>
            <p className="max-w-xl text-lg leading-snug md:text-xl">{slide.footer}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
