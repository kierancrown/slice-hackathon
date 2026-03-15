"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";

import { QuizSlide } from "@/components/presentation/quiz-slide";
import type { QuizProgress, Slide } from "@/components/presentation/types";
import { buildJoinUrl } from "@/lib/realtime/client";

type SlideRendererProps = {
  slide: Slide;
  index: number;
  total: number;
  quizState: QuizProgress[string] | undefined;
  facilitationTimer?: import("@/lib/realtime/protocol").RealtimeFacilitationTimerState | null;
  liveQuestion?: import("@/lib/realtime/protocol").RealtimeQuestionState | null;
  participantCount?: number;
  sessionCode?: string | null;
  liveConnected?: boolean;
  onQuizSelect: (slideId: string, optionId: string) => void;
  onQuizReveal: (slideId: string) => void;
};

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const metaTextClass = "text-xs font-semibold uppercase tracking-[0.28em] text-current/60";
const headingClass = "font-display uppercase leading-[0.9] tracking-[-0.02em]";
const darkPanelClass =
  "border-2 border-black/90 bg-[#111111] text-[#d6ff35] shadow-[10px_10px_0_rgba(0,0,0,0.16)]";
const limePanelClass =
  "border-2 border-black/85 bg-[#d6ff35] text-black shadow-[10px_10px_0_rgba(0,0,0,0.1)]";

function StepBadge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex min-h-16 min-w-16 items-center justify-center rounded-[0.8rem] border-2 border-black/85 px-4 font-display text-4xl leading-none tracking-[-0.05em] ${className ?? "bg-black text-[#d6ff35]"}`}
    >
      {value}
    </div>
  );
}

function TeamFormationTicker({
  prompts,
  timerLabel,
  timerMinutes,
  facilitationTimer,
}: {
  prompts: string[];
  timerLabel?: string;
  timerMinutes?: number;
  facilitationTimer?: import("@/lib/realtime/protocol").RealtimeFacilitationTimerState | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (prompts.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % prompts.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [prompts]);

  useEffect(() => {
    if (facilitationTimer?.status !== "running" || !facilitationTimer.startedAt) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [facilitationTimer?.startedAt, facilitationTimer?.status]);

  const activePrompt = prompts[activeIndex] ?? prompts[0] ?? "";
  const defaultDurationMs = (timerMinutes ?? 15) * 60 * 1000;
  const timerRunning =
    facilitationTimer?.status === "running" && Boolean(facilitationTimer.startedAt);
  const remainingMs = timerRunning
    ? Math.max(
        0,
        facilitationTimer!.durationMs - (now - (facilitationTimer!.startedAt ?? now)),
      )
    : defaultDurationMs;
  const remainingMinutes = Math.floor(remainingMs / 60000);
  const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
  const timerComplete = timerRunning && remainingMs === 0;
  const timerDisplay = `${String(remainingMinutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <div className={`${darkPanelClass} rounded-[2rem] p-6`}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/62">
          Live idea loop
        </p>
        <div className="mt-5 min-h-32">
          <motion.p
            key={activePrompt}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.35 }}
            className="font-display text-4xl uppercase leading-[0.92] tracking-[-0.04em] md:text-5xl"
          >
            {activePrompt}
          </motion.p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {prompts.map((prompt, promptIndex) => (
            <span
              key={prompt}
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                promptIndex === activeIndex
                  ? "border-[#d6ff35] bg-[#d6ff35] text-black"
                  : "border-[#d6ff35]/20 text-[#d6ff35]/72"
              }`}
            >
              {prompt}
            </span>
          ))}
        </div>
      </div>

      <div className={`${limePanelClass} flex flex-col justify-between rounded-[2rem] p-6`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/56">
            {timerLabel ?? "Timebox"}
          </p>
          <p className="mt-4 font-display text-[5rem] uppercase leading-[0.9] tracking-[-0.06em] md:text-[6rem]">
            {timerDisplay}
          </p>
          <p className="mt-4 text-lg leading-snug text-black/78">
            {timerComplete
              ? "Time. Bring people back, compare overlap, and lock the idea."
              : timerRunning
                ? "Idea sprint is live. Shortlist your ideas, then come back ready to compare and commit."
                : "Shortlist your ideas, then come back ready to compare and commit."}
          </p>
        </div>
        <div className="mt-6 rounded-[1.5rem] border-2 border-black/85 bg-white/35 px-4 py-4">
          <p className="text-sm uppercase tracking-[0.22em] text-black/56">Facilitator cue</p>
          <p className="mt-2 text-xl leading-tight text-black/84">
            {timerComplete
              ? "Regroup now. Spot duplicates, choose one idea, and start building."
              : "Aim for one clear problem, one useful workflow, and one demoable outcome."}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-black/58">
            {timerComplete ? "Timer complete" : timerRunning ? "Timer running" : "Ready to start"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SlideRenderer({
  slide,
  index,
  total,
  quizState,
  facilitationTimer,
  liveQuestion,
  participantCount = 0,
  sessionCode = null,
  liveConnected = false,
  onQuizSelect,
  onQuizReveal,
}: SlideRendererProps) {
  const isDark = slide.theme === "ink" || slide.theme === "pink";
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (slide.id !== "quiz-reset" || !sessionCode) {
      return;
    }

    let active = true;
    const joinUrl = buildJoinUrl(sessionCode);

    if (!joinUrl) {
      return;
    }

    QRCode.toDataURL(joinUrl, {
      margin: 1,
      color: {
        dark: isDark ? "#d6ff35" : "#111111",
        light: isDark ? "#111111" : "#d6ff35",
      },
      width: 220,
    })
      .then((dataUrl) => {
        if (active) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (active) {
          setQrDataUrl("");
        }
      });

    return () => {
      active = false;
    };
  }, [isDark, sessionCode, slide.id]);

  if (slide.kind === "quiz") {
    return (
      <QuizSlide
        slide={slide}
        index={index}
        total={total}
        isDark={isDark}
        selectedId={quizState?.selectedId ?? null}
        revealed={quizState?.revealed ?? false}
        liveQuestion={liveQuestion ?? null}
        onSelect={(optionId) => onQuizSelect(slide.id, optionId)}
        onReveal={() => onQuizReveal(slide.id)}
      />
    );
  }

  if (slide.kind === "hero") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex h-full flex-col justify-between gap-10"
      >
        <motion.div variants={itemVariants} className="flex items-start justify-between gap-6">
          <p className={`${metaTextClass} text-black/70`}>{slide.eyebrow}</p>
          <div className="inline-flex items-center gap-3 rounded-full border-2 border-black/85 bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#d6ff35]">
            <span>Slice Mobile</span>
            <span className="h-px w-8 bg-[#d6ff35]/40" />
            <span>
              {index + 1}/{total}
            </span>
          </div>
        </motion.div>

        <div className="grid flex-1 items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="inline-flex items-center rounded-full border-2 border-black/85 bg-white/35 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-black/80">
              {slide.meta}
            </div>
            <h1 className={`${headingClass} max-w-5xl text-[4.3rem] md:text-[6.8rem] lg:text-[8.6rem]`}>
              {slide.title}
            </h1>
            <p className="max-w-3xl text-2xl leading-[1.04] text-black/82 md:text-3xl">
              {slide.subtitle}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className={`${darkPanelClass} flex flex-col justify-between gap-8 rounded-[2rem] p-7`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d6ff35]/72">
                What this is
              </p>
              <p className="mt-4 text-[1.65rem] leading-[1.02] md:text-[1.95rem]">
                {slide.supportingLine}
              </p>
            </div>
            <div className="flex items-center">
              <StepBadge
                value={String(index + 1).padStart(2, "0")}
                className="bg-[#d6ff35] text-black"
              />
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="max-w-3xl">
          <div className={`${limePanelClass} rounded-[1.6rem] px-6 py-5`}>
            <p className="text-sm uppercase tracking-[0.22em] text-black/56">Big theme</p>
            <p className="mt-3 max-w-3xl text-xl leading-tight md:text-2xl">
              Practical, collaborative AI work over polished theatre.
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (slide.kind === "statement") {
    const showJoinPanel = slide.id === "quiz-reset" && Boolean(sessionCode);

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid h-full gap-8 lg:grid-cols-[1.08fr_0.92fr]"
      >
        <div className="flex flex-col justify-between gap-8">
          <div className="space-y-6">
            <motion.p variants={itemVariants} className={metaTextClass}>
              {slide.eyebrow}
            </motion.p>
            <motion.h2
              variants={itemVariants}
              className={`${headingClass} max-w-4xl text-6xl md:text-7xl lg:text-[6.4rem]`}
            >
              {slide.title}
            </motion.h2>
            <motion.p variants={itemVariants} className="max-w-3xl text-xl leading-[1.12] md:text-2xl">
              {slide.body}
            </motion.p>
          </div>
          {slide.callout ? (
            <motion.div variants={itemVariants} className={`${darkPanelClass} max-w-2xl rounded-[1.8rem] px-6 py-6`}>
              <p className="text-sm uppercase tracking-[0.22em] text-[#d6ff35]/68">Key point</p>
              <p className="mt-3 text-lg leading-snug md:text-xl">{slide.callout}</p>
            </motion.div>
          ) : null}
        </div>

        <div className="flex flex-col justify-between gap-6">
          {showJoinPanel ? (
            <motion.div variants={itemVariants} className={`${limePanelClass} rounded-[1.7rem] p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/56">
                    Join the quiz
                  </p>
                  <p className="mt-2 text-lg leading-snug text-black/82">
                    Scan to join as a viewer before we start.
                  </p>
                </div>
                <div className="text-right text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
                  <p>{participantCount} joined</p>
                  <p>{liveConnected ? "Connected" : "Connecting"}</p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                {qrDataUrl ? (
                  <Image
                    src={qrDataUrl}
                    alt="QR code to join the live session"
                    width={132}
                    height={132}
                    className="h-28 w-28 rounded-[1rem] border border-black/18 bg-[#d6ff35] md:h-32 md:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-[1rem] border border-black/18 bg-white/35 text-xs font-semibold uppercase tracking-[0.18em] text-black/55 md:h-32 md:w-32">
                    QR loading
                  </div>
                )}
                <div className={`${darkPanelClass} max-w-sm rounded-[1.2rem] px-4 py-4`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/62">
                    Presenter check
                  </p>
                  <p className="mt-2 text-base leading-snug">
                    Wait until the room is in before revealing the first question.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
          {slide.bullets ? (
            <motion.div variants={itemVariants} className="grid gap-4">
              {slide.bullets.map((bullet, bulletIndex) => (
                <div key={bullet} className={`${limePanelClass} rounded-[1.7rem] p-5`}>
                  <div className="flex items-start gap-4">
                    <StepBadge
                      value={String(bulletIndex + 1).padStart(2, "0")}
                      className="bg-black text-[#d6ff35]"
                    />
                    <p className="pt-1 text-2xl leading-[1.02] md:text-[2rem]">{bullet}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <div />
          )}
        </div>
      </motion.div>
    );
  }

  if (slide.kind === "list") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex h-full flex-col gap-8"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-4">
            <motion.p variants={itemVariants} className={metaTextClass}>
              {slide.eyebrow}
            </motion.p>
            <motion.h2 variants={itemVariants} className={`${headingClass} max-w-5xl text-6xl md:text-7xl lg:text-[6.2rem]`}>
              {slide.title}
            </motion.h2>
          </div>
          <motion.div variants={itemVariants}>
            <StepBadge value={String(index + 1).padStart(2, "0")} />
          </motion.div>
        </div>
        <motion.p variants={itemVariants} className="max-w-4xl text-xl leading-[1.08] md:text-2xl">
          {slide.intro}
        </motion.p>
        <div className="grid flex-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {slide.items.map((item, itemIndex) => (
            <motion.div
              key={item}
              variants={itemVariants}
              className={`${limePanelClass} flex flex-col rounded-[1.8rem] p-6`}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="max-w-xs font-display text-3xl uppercase leading-[0.96] tracking-[-0.05em] md:text-[2.6rem]">
                  {item}
                </p>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-black/56">
                  {String(itemIndex + 1).padStart(2, "0")}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        {slide.footer ? (
          <motion.div variants={itemVariants} className={`${darkPanelClass} max-w-4xl rounded-[1.8rem] px-6 py-5`}>
            <p className="text-lg leading-snug md:text-xl">{slide.footer}</p>
          </motion.div>
        ) : null}
      </motion.div>
    );
  }

  if (slide.kind === "function-grid") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex h-full flex-col gap-8"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-4">
            <motion.p variants={itemVariants} className={metaTextClass}>
              {slide.eyebrow}
            </motion.p>
            <motion.h2 variants={itemVariants} className={`${headingClass} max-w-5xl text-6xl md:text-7xl lg:text-[5.8rem]`}>
              {slide.title}
            </motion.h2>
          </div>
          <motion.div variants={itemVariants}>
            <StepBadge value={String(index + 1).padStart(2, "0")} />
          </motion.div>
        </div>
        <motion.p variants={itemVariants} className="max-w-4xl text-xl leading-[1.08] md:text-2xl">
          {slide.intro}
        </motion.p>
        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {slide.functions.map((item) => (
            <motion.div key={item.team} variants={itemVariants} className={`${limePanelClass} rounded-[1.8rem] p-5`}>
              <p className="font-display text-3xl uppercase leading-[0.9] tracking-[-0.05em] md:text-4xl">
                {item.team}
              </p>
              <div className="mt-4 space-y-3">
                {item.examples.map((example) => (
                  <p
                    key={example}
                    className="border-t-2 border-black/15 pt-3 text-lg leading-snug text-black/80"
                  >
                    {example}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (slide.kind === "timeline") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex h-full flex-col gap-6"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-4">
            <motion.p variants={itemVariants} className={metaTextClass}>
              {slide.eyebrow}
            </motion.p>
            <motion.h2 variants={itemVariants} className={`${headingClass} max-w-5xl text-5xl md:text-6xl lg:text-[5.2rem]`}>
              {slide.title}
            </motion.h2>
          </div>
          <motion.div variants={itemVariants}>
            <StepBadge value={String(index + 1).padStart(2, "0")} />
          </motion.div>
        </div>
        <motion.p variants={itemVariants} className="max-w-4xl text-lg leading-[1.08] md:text-[1.65rem]">
          {slide.intro}
        </motion.p>
        <div className="grid flex-1 gap-4 lg:grid-cols-[0.58fr_1.42fr]">
          <motion.div variants={itemVariants} className={`${darkPanelClass} flex flex-col justify-between rounded-[2rem] p-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/62">
              Build rhythm
            </p>
            <p className="mt-4 font-display text-4xl uppercase leading-[0.9] tracking-[-0.06em] md:text-5xl">
              From kickoff to demo
            </p>
            <p className="mt-4 text-base leading-snug text-[#d6ff35]/78 md:text-lg">
              Keep teams moving. One clear idea, fast alignment, then enough build to show something real.
            </p>
          </motion.div>
          <div className="grid gap-3 md:grid-cols-2">
            {slide.phases.map((phase, phaseIndex) => (
              <motion.div key={phase} variants={itemVariants} className={`${limePanelClass} rounded-[1.5rem] p-4`}>
                <div className="flex items-start gap-4">
                  <StepBadge
                    value={String(phaseIndex + 1).padStart(2, "0")}
                    className="bg-black text-[#d6ff35]"
                  />
                  <p className="pt-1 text-xl leading-[1.04] md:text-[1.7rem]">{phase}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (slide.kind === "prompts") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex h-full flex-col gap-8"
      >
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <motion.p variants={itemVariants} className={metaTextClass}>
                {slide.eyebrow}
              </motion.p>
              <motion.h2 variants={itemVariants} className={`${headingClass} max-w-4xl text-6xl md:text-7xl lg:text-[5.9rem]`}>
                {slide.title}
              </motion.h2>
            </div>
            <motion.p variants={itemVariants} className="max-w-2xl text-xl leading-[1.08] md:text-2xl">
              {slide.intro}
            </motion.p>
            <motion.div variants={itemVariants}>
              <div className={`${darkPanelClass} inline-flex items-center gap-3 rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em]`}>
                <span>Idea sprint</span>
                <span>
                  {index + 1}/{total}
                </span>
              </div>
            </motion.div>
          </div>

          <motion.div variants={itemVariants}>
            <TeamFormationTicker
              prompts={slide.prompts}
              timerLabel={slide.timerLabel}
              timerMinutes={slide.timerMinutes}
              facilitationTimer={facilitationTimer}
            />
          </motion.div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {slide.prompts.map((prompt) => (
            <motion.div key={prompt} variants={itemVariants} className={`${limePanelClass} rounded-[1.5rem] px-4 py-4`}>
              <p className="text-lg leading-snug md:text-xl">{prompt}</p>
            </motion.div>
          ))}
        </div>

        {slide.footer ? (
          <motion.div variants={itemVariants} className={`${darkPanelClass} max-w-5xl rounded-[1.8rem] px-6 py-5`}>
            <p className="text-lg leading-snug md:text-xl">{slide.footer}</p>
          </motion.div>
        ) : null}
      </motion.div>
    );
  }

  if (slide.kind === "vote") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid h-full gap-8 lg:grid-cols-[1fr_0.92fr]"
      >
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <motion.p variants={itemVariants} className={metaTextClass}>
              {slide.eyebrow ?? "Voting"}
            </motion.p>
            <motion.h2 variants={itemVariants} className={`${headingClass} max-w-5xl text-6xl md:text-7xl lg:text-[6rem]`}>
              {slide.title}
            </motion.h2>
            <motion.p variants={itemVariants} className="max-w-3xl text-xl leading-[1.1] md:text-2xl">
              {slide.intro}
            </motion.p>
          </div>

          <div className="grid gap-4">
            {slide.items.map((item, itemIndex) => (
              <motion.div key={item} variants={itemVariants} className={`${limePanelClass} rounded-[1.7rem] p-5`}>
                <div className="flex items-start gap-4">
                  <StepBadge
                    value={String(itemIndex + 1).padStart(2, "0")}
                    className="bg-black text-[#d6ff35]"
                  />
                  <p className="pt-1 text-2xl leading-[1.02] md:text-[2rem]">{item}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6">
          <motion.div variants={itemVariants} className={`${darkPanelClass} rounded-[2rem] p-6`}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/62">
              Voting mode
            </p>
            <p className="mt-4 font-display text-4xl uppercase leading-[0.92] tracking-[-0.05em] md:text-5xl">
              {slide.voting.status === "coming-soon" ? "Coming soon" : slide.voting.status}
            </p>
            <p className="mt-4 text-lg leading-snug text-[#d6ff35]/82">{slide.voting.prompt}</p>
          </motion.div>
          {slide.footer ? (
            <motion.div variants={itemVariants} className={`${limePanelClass} rounded-[1.8rem] px-6 py-5`}>
              <p className="text-lg leading-snug md:text-xl">{slide.footer}</p>
            </motion.div>
          ) : null}
          <motion.div variants={itemVariants} className="flex justify-end">
            <StepBadge value={String(index + 1).padStart(2, "0")} />
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex h-full flex-col justify-between gap-10"
    >
      <div className="space-y-6">
        <motion.p variants={itemVariants} className={metaTextClass}>
          {slide.eyebrow}
        </motion.p>
        <motion.h2 variants={itemVariants} className={`${headingClass} max-w-5xl text-[4.5rem] md:text-[7rem] lg:text-[8.2rem]`}>
          {slide.title}
        </motion.h2>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <motion.div variants={itemVariants} className="space-y-4">
          {slide.lines.map((line) => (
            <div key={line} className={`${limePanelClass} rounded-[1.7rem] px-5 py-5`}>
              <p className="text-2xl leading-tight md:text-4xl">{line}</p>
            </div>
          ))}
        </motion.div>
        <motion.div variants={itemVariants} className={`${darkPanelClass} justify-self-end rounded-[2rem] px-6 py-6 lg:max-w-xl`}>
          <p className="text-sm uppercase tracking-[0.22em] text-[#d6ff35]/62">Final push</p>
          <p className="mt-4 text-2xl leading-tight md:text-3xl">{slide.kicker}</p>
        </motion.div>
      </div>
      <motion.div variants={itemVariants} className="flex justify-end">
        <StepBadge value={String(index + 1).padStart(2, "0")} />
      </motion.div>
    </motion.div>
  );
}
