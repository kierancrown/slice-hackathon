"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { QuizSlide } from "@/components/presentation/types";
import { getSlideById, isQuizSlide } from "@/lib/presentation";
import {
  createPartySocket,
  getOrCreateStoredValue,
  randomCode,
} from "@/lib/realtime/client";
import type {
  ClientMessage,
  RealtimeQuestionState,
  RealtimeSessionState,
  ServerMessage,
} from "@/lib/realtime/protocol";

const AUDIENCE_ID_KEY = "slice-ai-audience-id";
const AUDIENCE_NAME_KEY = "slice-ai-audience-name";

type JoinPageClientProps = {
  code: string;
};

function QuestionCard({
  slide,
  question,
  selectedId,
  onVote,
}: {
  slide: QuizSlide;
  question: RealtimeQuestionState;
  selectedId: string | null;
  onVote: (optionId: string) => void;
}) {
  const revealed = question.status === "revealed";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-current/55">
          {slide.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-5xl uppercase leading-[0.88] tracking-[-0.05em]">
          {slide.title}
        </h1>
        <p className="mt-4 text-lg leading-snug text-current/80">{slide.prompt}</p>
      </div>

      <div className="space-y-3">
        {slide.options.map((option) => {
          const votes = question.totals[option.id] ?? 0;
          const isCorrect = option.id === slide.answerId;
          const isSelected = selectedId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onVote(option.id)}
              disabled={revealed}
              className={`w-full rounded-[1.5rem] border-2 px-5 py-5 text-left transition ${
                revealed
                  ? isCorrect
                    ? "border-black bg-black text-[#d6ff35]"
                    : isSelected
                      ? "border-black bg-[#d6ff35] text-black"
                      : "border-black/18 bg-transparent text-current"
                  : isSelected
                    ? "border-black bg-black text-[#d6ff35]"
                    : "border-black/18 bg-transparent text-current"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl uppercase leading-none tracking-[-0.04em]">
                    {option.label}
                  </p>
                  <p className="mt-2 text-base leading-snug">{option.text}</p>
                </div>
                {revealed ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.22em]">
                    {votes} votes
                  </p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-[1.4rem] border border-current/18 bg-black px-4 py-4 text-[#d6ff35]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/55">
          {revealed ? "Results" : "Vote status"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#d6ff35]/82">
          {revealed
            ? slide.explanation
            : selectedId
              ? "Your vote is in. You can change it until the presenter reveals the answer."
              : "Choose one answer. Your phone will stay in sync as the presenter moves on."}
        </p>
      </div>
    </div>
  );
}

export function JoinPageClient({ code }: JoinPageClientProps) {
  const [participantId] = useState(() =>
    typeof window === "undefined"
      ? ""
      : getOrCreateStoredValue(
          AUDIENCE_ID_KEY,
          () => `audience-${randomCode(10).toLowerCase()}`,
        ),
  );
  const [name, setName] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem(AUDIENCE_NAME_KEY) ?? "",
  );
  const [draftName, setDraftName] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem(AUDIENCE_NAME_KEY) ?? "",
  );
  const [sessionState, setSessionState] = useState<RealtimeSessionState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const normalizedCode = useMemo(() => code.toUpperCase(), [code]);

  useEffect(() => {
    if (!participantId || !name) {
      return;
    }

    const socket = createPartySocket(normalizedCode);
    if (!socket) {
      return;
    }

    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setConnected(true);
      setError(null);
      socket.send(
        JSON.stringify({
          type: "register",
          role: "audience",
          participantId,
          name,
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
    });

    socket.addEventListener("error", () => {
      setError("Unable to connect to the live session.");
    });

    return () => {
      socketRef.current = null;
      socket.close();
    };
  }, [normalizedCode, participantId, name]);

  const submitName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextName = draftName.trim();
    if (!nextName) {
      return;
    }

    window.localStorage.setItem(AUDIENCE_NAME_KEY, nextName);
    setName(nextName);

    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN && participantId) {
      socket.send(
        JSON.stringify({
          type: "set_name",
          participantId,
          name: nextName,
        } satisfies ClientMessage),
      );
    }
  };

  const currentSlide = getSlideById(sessionState?.currentSlideId ?? null);
  const currentQuiz = isQuizSlide(currentSlide) ? currentSlide : null;
  const currentQuestion =
    currentQuiz && sessionState ? sessionState.questions[currentQuiz.id] ?? null : null;
  const selectedId =
    currentQuestion && participantId ? currentQuestion.votes[participantId] ?? null : null;

  const submitVote = (optionId: string) => {
    if (!currentQuiz || !participantId) {
      return;
    }

    socketRef.current?.send(
      JSON.stringify({
        type: "vote_submit",
        slideId: currentQuiz.id,
        optionId,
        participantId,
      } satisfies ClientMessage),
    );
  };

  return (
    <main className="min-h-screen bg-[#d6ff35] px-5 py-6 text-black md:px-8">
      <div className="mx-auto max-w-xl">
        <div className="rounded-[2rem] border-2 border-black bg-[#d6ff35] p-5 shadow-[10px_10px_0_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-[1rem] bg-black px-3 py-3">
                <Image
                  src="/branding/slice-logo.svg"
                  alt="Slice"
                  width={92}
                  height={30}
                  className="h-5 w-auto brightness-0 invert"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/55">
                  Slice live quiz
                </p>
                <p className="mt-2 font-display text-4xl uppercase leading-none tracking-[-0.05em]">
                  {normalizedCode}
                </p>
              </div>
            </div>
            <div className="text-right text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
              <p>{connected ? "Connected" : "Connecting"}</p>
              {sessionState ? <p>{sessionState.participants.length} joined</p> : null}
            </div>
          </div>

          {!name ? (
            <form onSubmit={submitName} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-black/55">
                  Your name
                </span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Enter your name"
                  className="mt-2 w-full rounded-[1.2rem] border-2 border-black bg-transparent px-4 py-4 text-lg outline-none placeholder:text-black/35 focus:bg-white/35"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-full border-2 border-black bg-black px-4 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#d6ff35]"
              >
                Join session
              </button>
            </form>
          ) : currentQuiz && currentQuestion ? (
            <div className="mt-6">
              <QuestionCard
                slide={currentQuiz}
                question={currentQuestion}
                selectedId={selectedId}
                onVote={submitVote}
              />
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border-2 border-black bg-black px-5 py-5 text-[#d6ff35]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/55">
                Waiting
              </p>
              <p className="mt-3 text-lg leading-snug">
                {sessionState?.currentSlideId
                  ? "The presenter is not on a quiz slide right now. Your phone will update automatically when the next question opens."
                  : "Waiting for the presenter to start the live session."}
              </p>
            </div>
          )}

          {error ? (
            <div className="mt-4 rounded-[1.2rem] border-2 border-black bg-white/35 px-4 py-4">
              <p className="text-sm leading-relaxed">{error}</p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
