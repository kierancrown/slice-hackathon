"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { decks, getDeckById, getDeckIdForSlide, getSlideById } from "@/lib/presentation";
import { createPartySocket, getAppUrl } from "@/lib/realtime/client";
import type {
  ClientMessage,
  RealtimeFacilitationTimerState,
  RealtimeSessionState,
  ServerMessage,
} from "@/lib/realtime/protocol";

type RemotePageClientProps = {
  code: string;
  token: string;
};

function formatRemaining(timer: RealtimeFacilitationTimerState | null, now: number) {
  if (!timer?.startedAt || timer.status !== "running") {
    return "15:00";
  }

  const remainingMs = Math.max(0, timer.durationMs - (now - timer.startedAt));
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RemotePageClient({ code, token }: RemotePageClientProps) {
  const [sessionState, setSessionState] = useState<RealtimeSessionState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const normalizedCode = useMemo(() => code.toUpperCase(), [code]);
  const buildLoopUrl = `${getAppUrl()}/build-loop`;

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = createPartySocket(normalizedCode);
    if (!socket) {
      return;
    }

    const scheduleReconnect = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }

      reconnectTimerRef.current = window.setTimeout(() => {
        setReconnectNonce((current) => current + 1);
      }, 1200);
    };

    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setConnected(true);
      setError(null);
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      socket.send(
        JSON.stringify({
          type: "register",
          role: "presenter",
          participantId: "presenter-remote-phone",
          name: "Remote",
          presenterSecret: token,
        } satisfies ClientMessage),
      );
    });

    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        if (message.type === "session_state") {
          setSessionState(message.state);
        } else if (message.type === "error") {
          setError(message.message);
        }
      } catch {
        setError("Received an invalid realtime message.");
      }
    });

    socket.addEventListener("close", () => {
      setConnected(false);
      scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      setError("Unable to connect to the remote.");
      scheduleReconnect();
    });

    return () => {
      socketRef.current = null;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      socket.close();
    };
  }, [normalizedCode, reconnectNonce, token]);

  useEffect(() => {
    const refreshConnection = () => {
      const socket = socketRef.current;
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        setReconnectNonce((current) => current + 1);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshConnection();
      }
    };

    window.addEventListener("focus", refreshConnection);
    window.addEventListener("online", refreshConnection);
    window.addEventListener("pageshow", refreshConnection);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshConnection);
      window.removeEventListener("online", refreshConnection);
      window.removeEventListener("pageshow", refreshConnection);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (sessionState?.facilitationTimer?.status !== "running") {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [sessionState?.facilitationTimer?.startedAt, sessionState?.facilitationTimer?.status]);

  const currentDeckId = getDeckIdForSlide(sessionState?.currentSlideId ?? null);
  const currentDeck = getDeckById(currentDeckId);
  const currentSlide = getSlideById(sessionState?.currentSlideId ?? null, currentDeckId);
  const currentIndex = currentSlide
    ? currentDeck?.slides.findIndex((slide) => slide.id === currentSlide.id) ?? -1
    : -1;
  const currentQuiz = currentSlide?.kind === "quiz" ? currentSlide : null;
  const facilitationTimer = sessionState?.facilitationTimer ?? null;
  const facilitationTimerLabel = formatRemaining(facilitationTimer, now);
  const facilitationTimerActive =
    facilitationTimer?.status === "running" && facilitationTimer.slideId === "team-formation";

  const send = (message: ClientMessage) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(message));
  };

  const move = (delta: number) => {
    if (currentIndex < 0) {
      return;
    }

    const slides = currentDeck?.slides ?? [];
    const nextIndex = Math.min(Math.max(currentIndex + delta, 0), slides.length - 1);
    const nextSlide = slides[nextIndex];
    if (!nextSlide) {
      return;
    }

    send({
      type: "slide_set",
      slideId: nextSlide.id,
      presenterSecret: token,
    });
  };

  const jumpToSlide = (slideId: string) => {
    send({
      type: "slide_set",
      slideId,
      presenterSecret: token,
    });
  };

  const reveal = () => {
    if (!currentQuiz) {
      return;
    }

    send({
      type: "question_reveal",
      slideId: currentQuiz.id,
      presenterSecret: token,
    });
  };

  const reset = () => {
    if (!currentQuiz) {
      return;
    }

    send({
      type: "question_reset",
      slideId: currentQuiz.id,
      presenterSecret: token,
    });
  };

  const startIdeaTimer = () => {
    send({
      type: "timer_start",
      slideId: "team-formation",
      durationMs: 15 * 60 * 1000,
      presenterSecret: token,
    });
  };

  const resetIdeaTimer = () => {
    send({
      type: "timer_reset",
      presenterSecret: token,
    });
  };

  const resetSession = () => {
    send({
      type: "session_reset",
      presenterSecret: token,
    });
  };

  return (
    <main className="min-h-screen bg-[#111111] px-5 py-6 text-[#d6ff35]">
      <div className="mx-auto max-w-md space-y-6">
        <div className="rounded-[2rem] border border-[#d6ff35]/18 bg-black px-5 py-5 shadow-[10px_10px_0_rgba(214,255,53,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div className="rounded-[1rem] bg-[#d6ff35] px-3 py-3">
              <Image
                src="/branding/slice-logo.svg"
                alt="Slice"
                width={96}
                height={30}
                className="h-5 w-auto"
              />
            </div>
            <div className="text-right text-xs font-semibold uppercase tracking-[0.2em] text-[#d6ff35]/68">
              <p>{connected ? "Connected" : "Connecting"}</p>
              <p>{normalizedCode}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-[#d6ff35]/18 bg-white/6 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/55">
              Current slide
            </p>
            <p className="mt-3 font-display text-4xl uppercase leading-[0.9] tracking-[-0.02em]">
              {currentSlide?.title ?? "Waiting"}
            </p>
            {currentSlide ? (
              <p className="mt-3 text-sm uppercase tracking-[0.18em] text-[#d6ff35]/68">
                {currentDeck?.title ?? "Deck"} • Slide {currentIndex + 1} of{" "}
                {currentDeck?.slides.length ?? 0}
              </p>
            ) : null}
            {error ? <p className="mt-3 text-sm text-[#d6ff35]/78">{error}</p> : null}
          </div>

          {currentSlide?.speakerNotes ? (
            <div className="mt-6 rounded-[1.4rem] border border-[#d6ff35]/18 bg-[#d6ff35] px-4 py-4 text-black">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/55">
                Speaker notes
              </p>
              <p className="mt-3 text-sm leading-relaxed text-black/82">
                {currentSlide.speakerNotes}
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => move(-1)}
              className="rounded-[1.2rem] border border-[#d6ff35]/18 bg-white/6 px-4 py-4 text-sm font-semibold uppercase tracking-[0.22em]"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              className="rounded-[1.2rem] border border-[#d6ff35] bg-[#d6ff35] px-4 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black"
            >
              Next
            </button>
          </div>

          {currentQuiz ? (
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={reveal}
                className="w-full rounded-[1.2rem] border border-[#d6ff35] bg-[#d6ff35] px-4 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black"
              >
                Reveal answer
              </button>
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-[1.2rem] border border-[#d6ff35]/18 bg-white/6 px-4 py-4 text-sm font-semibold uppercase tracking-[0.22em]"
              >
                Reset question
              </button>
            </div>
          ) : null}
        </div>

        <section className="rounded-[2rem] border border-[#d6ff35]/18 bg-black px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/55">
            Facilitation
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => jumpToSlide("opening")}
              className="rounded-[1.1rem] border border-[#d6ff35]/18 bg-white/6 px-3 py-4 text-sm font-semibold uppercase tracking-[0.18em]"
            >
              Start Day 1
            </button>
            <button
              type="button"
              onClick={() => jumpToSlide("day2-reset")}
              className="rounded-[1.1rem] border border-[#d6ff35]/18 bg-white/6 px-3 py-4 text-sm font-semibold uppercase tracking-[0.18em]"
            >
              Start Day 2
            </button>
            <button
              type="button"
              onClick={() => jumpToSlide("team-formation")}
              className="rounded-[1.1rem] border border-[#d6ff35]/18 bg-white/6 px-3 py-4 text-sm font-semibold uppercase tracking-[0.18em]"
            >
              Team formation
            </button>
            <a
              href={buildLoopUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-[1.1rem] border border-[#d6ff35] bg-[#d6ff35] px-3 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-black"
            >
              Open build loop
            </a>
          </div>

          <button
            type="button"
            onClick={resetSession}
            className="mt-4 w-full rounded-[1.2rem] border border-[#d6ff35]/22 bg-[#1b1b1b] px-4 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#d6ff35] transition hover:border-[#d6ff35] hover:bg-white/6"
          >
            Clear session and start fresh
          </button>

          <div className="mt-5 rounded-[1.4rem] border border-[#d6ff35]/18 bg-white/6 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/55">
                  Idea timer
                </p>
                <p className="mt-2 font-display text-4xl uppercase leading-none tracking-[-0.04em]">
                  {facilitationTimerLabel}
                </p>
              </div>
              <p className="text-right text-xs font-semibold uppercase tracking-[0.18em] text-[#d6ff35]/68">
                {facilitationTimerActive ? "Running" : "Ready"}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startIdeaTimer}
                className="rounded-[1.1rem] border border-[#d6ff35] bg-[#d6ff35] px-3 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black"
              >
                Start 15 min
              </button>
              <button
                type="button"
                onClick={resetIdeaTimer}
                className="rounded-[1.1rem] border border-[#d6ff35]/18 bg-white/6 px-3 py-3 text-sm font-semibold uppercase tracking-[0.18em]"
              >
                Reset timer
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#d6ff35]/18 bg-black px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/55">
            Deck menu
          </p>
          <div className="mt-4 space-y-5">
            {decks.map((deck) => (
              <div key={deck.id} className="rounded-[1.4rem] border border-[#d6ff35]/18 bg-white/6 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl uppercase leading-none tracking-[-0.04em]">
                      {deck.title}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#d6ff35]/58">
                      {deck.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => jumpToSlide(deck.slides[0].id)}
                    className="rounded-full border border-[#d6ff35]/18 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                  >
                    Open
                  </button>
                </div>

                <div className="mt-4 grid gap-2">
                  {deck.slides.map((slide, index) => {
                    const active = slide.id === currentSlide?.id;

                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => jumpToSlide(slide.id)}
                        className={`rounded-[1rem] border px-3 py-3 text-left transition ${
                          active
                            ? "border-[#d6ff35] bg-[#d6ff35] text-black"
                            : "border-[#d6ff35]/18 bg-black/25 text-[#d6ff35]"
                        }`}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <p className="mt-2 text-sm leading-snug">{slide.title}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
