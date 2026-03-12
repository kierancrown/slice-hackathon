"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import type { QuizSlide, Slide } from "@/components/presentation/types";
import type { RealtimeQuestionState, RealtimeSessionState } from "@/lib/realtime/protocol";

type LiveSessionPanelProps = {
  currentSlide: Slide;
  sessionCode: string | null;
  joinUrl: string;
  connected: boolean;
  error: string | null;
  state: RealtimeSessionState | null;
  currentQuestion: RealtimeQuestionState | null;
  onStart: () => void;
  onStop: () => void;
  onReveal: () => void;
  onReset: () => void;
};

function QuizResults({
  slide,
  question,
}: {
  slide: QuizSlide;
  question: RealtimeQuestionState;
}) {
  return (
    <div className="space-y-3">
      {slide.options.map((option) => {
        const votes = question.totals[option.id] ?? 0;
        const percent = question.totalVotes ? Math.round((votes / question.totalVotes) * 100) : 0;
        const isCorrect = option.id === slide.answerId;

        return (
          <div
            key={option.id}
            className={`rounded-[1.2rem] border px-4 py-4 ${
              isCorrect
                ? "border-[#d6ff35] bg-[#d6ff35] text-black"
                : "border-[#d6ff35]/18 bg-white/6 text-[#d6ff35]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm leading-snug">{option.text}</p>
              <div className="text-right text-xs font-semibold uppercase tracking-[0.22em]">
                <p>{votes} votes</p>
                <p>{percent}%</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/12">
              <div
                className={`h-full rounded-full ${isCorrect ? "bg-black" : "bg-[#d6ff35]"}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LiveSessionPanel({
  currentSlide,
  sessionCode,
  joinUrl,
  connected,
  error,
  state,
  currentQuestion,
  onStart,
  onStop,
  onReveal,
  onReset,
}: LiveSessionPanelProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let active = true;

    if (!joinUrl) {
      return;
    }

    QRCode.toDataURL(joinUrl, {
      margin: 1,
      color: {
        dark: "#111111",
        light: "#d6ff35",
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
  }, [joinUrl]);

  const currentQuiz = currentSlide.kind === "quiz" ? currentSlide : null;

  return (
    <aside className="absolute left-6 top-24 z-30 hidden w-[25rem] border border-current/20 bg-black/92 p-4 text-[#d6ff35] xl:block">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/58">
            Live session
          </p>
          <p className="mt-2 font-display text-4xl uppercase leading-none tracking-[-0.05em]">
            {sessionCode ?? "Offline"}
          </p>
        </div>
        {sessionCode ? (
          <button
            type="button"
            onClick={onStop}
            className="border border-[#d6ff35]/24 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition hover:border-[#d6ff35] hover:bg-white/6"
          >
            End
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            className="border border-[#d6ff35] bg-[#d6ff35] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#c8f12e]"
          >
            Start
          </button>
        )}
      </div>

      <div className="mt-4 rounded-[1.4rem] border border-[#d6ff35]/18 bg-white/6 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/58">
          Status
        </p>
        <p className="mt-2 text-sm uppercase tracking-[0.18em]">
          {connected ? "Connected" : sessionCode ? "Connecting" : "Not started"}
        </p>
        {error ? <p className="mt-2 text-sm text-[#d6ff35]/78">{error}</p> : null}
        {state ? (
          <div className="mt-4 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#d6ff35]/68">
            <span>{state.participants.length} participants</span>
            <span>{state.activeQuestionSlideId ? "Question live" : "Slide sync only"}</span>
          </div>
        ) : null}
      </div>

      {sessionCode && joinUrl ? (
        <div className="mt-4 rounded-[1.4rem] border border-[#d6ff35]/18 bg-[#d6ff35] p-4 text-black">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/58">
            Audience join
          </p>
          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt={`QR code to join session ${sessionCode}`}
              width={160}
              height={160}
              className="mt-3 h-40 w-40 border border-black/20 bg-[#d6ff35]"
            />
          ) : null}
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
            {joinUrl}
          </p>
        </div>
      ) : null}

      {currentQuiz && currentQuestion ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/58">
                Current quiz
              </p>
              <p className="mt-2 text-lg leading-tight">{currentQuiz.title}</p>
            </div>
            <div className="text-right text-xs font-semibold uppercase tracking-[0.18em] text-[#d6ff35]/68">
              <p>{currentQuestion.totalVotes} votes</p>
              <p>{currentQuestion.status}</p>
            </div>
          </div>

          <QuizResults slide={currentQuiz} question={currentQuestion} />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReveal}
              className="border border-[#d6ff35] bg-[#d6ff35] px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-[#c8f12e]"
            >
              Reveal
            </button>
            <button
              type="button"
              onClick={onReset}
              className="border border-[#d6ff35]/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition hover:border-[#d6ff35] hover:bg-white/6"
            >
              Reset
            </button>
          </div>
        </div>
      ) : sessionCode ? (
        <div className="mt-4 rounded-[1.4rem] border border-[#d6ff35]/18 bg-white/4 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/58">
            Current state
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#d6ff35]/80">
            Audience phones will follow the active slide automatically. Move onto a quiz slide to open voting.
          </p>
        </div>
      ) : null}
    </aside>
  );
}
