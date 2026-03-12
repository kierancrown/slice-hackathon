"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { slides } from "@/data/slides";
import { getSlideById } from "@/lib/presentation";
import { createPartySocket } from "@/lib/realtime/client";
import type {
  ClientMessage,
  RealtimeSessionState,
  ServerMessage,
} from "@/lib/realtime/protocol";

type RemotePageClientProps = {
  code: string;
  token: string;
};

function getIndexById(slideId: string | null | undefined) {
  if (!slideId) {
    return -1;
  }

  return slides.findIndex((slide) => slide.id === slideId);
}

export function RemotePageClient({ code, token }: RemotePageClientProps) {
  const [sessionState, setSessionState] = useState<RealtimeSessionState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectNonce, setReconnectNonce] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const normalizedCode = useMemo(() => code.toUpperCase(), [code]);

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

  const currentSlide = getSlideById(sessionState?.currentSlideId ?? null);
  const currentIndex = sessionState ? getIndexById(sessionState.currentSlideId) : -1;
  const currentQuiz = currentSlide?.kind === "quiz" ? currentSlide : null;

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

  return (
    <main className="min-h-screen bg-[#111111] px-5 py-6 text-[#d6ff35]">
      <div className="mx-auto max-w-md rounded-[2rem] border border-[#d6ff35]/18 bg-black px-5 py-5 shadow-[10px_10px_0_rgba(214,255,53,0.08)]">
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
              Slide {currentIndex + 1} of {slides.length}
            </p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-[#d6ff35]/78">{error}</p> : null}
        </div>

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
    </main>
  );
}
