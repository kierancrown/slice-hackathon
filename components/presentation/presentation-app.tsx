"use client";

import Image from "next/image";
import {
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import { LiveSessionPanel } from "@/components/presentation/live-session-panel";
import { SlideRenderer } from "@/components/presentation/slide-renderer";
import type { QuizProgress, Slide, SlideTheme } from "@/components/presentation/types";
import { slides } from "@/data/slides";
import {
  buildJoinUrl,
  createPartySocket,
  getPartyHost,
  getOrCreateStoredValue,
  randomCode,
  randomSecret,
} from "@/lib/realtime/client";
import type {
  ClientMessage,
  RealtimeSessionState,
  ServerMessage,
} from "@/lib/realtime/protocol";

const CURRENT_SLIDE_KEY = "slice-ai-current-slide";
const QUIZ_PROGRESS_KEY = "slice-ai-quiz-progress";
const TIMER_KEY = "slice-ai-timer-started-at";
const LIVE_SESSION_CODE_KEY = "slice-ai-live-session-code";
const LIVE_PRESENTER_SECRET_KEY = "slice-ai-live-presenter-secret";
const LIVE_PRESENTER_ID_KEY = "slice-ai-live-presenter-id";

const themeClasses: Record<SlideTheme, string> = {
  lime: "bg-[#d6ff35] text-black",
  ink: "bg-[#111111] text-[#d6ff35]",
  blue: "bg-[#d6ff35] text-black",
  pink: "bg-[#111111] text-[#d6ff35]",
};

const quizSlides = slides.filter((slide) => slide.kind === "quiz");

function clampIndex(index: number) {
  return Math.min(Math.max(index, 0), slides.length - 1);
}

function getIndexFromTarget(target: string | null): number | null {
  if (!target) {
    return null;
  }

  const numeric = Number(target);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= slides.length) {
    return numeric - 1;
  }

  const byId = slides.findIndex((slide) => slide.id === target);
  return byId >= 0 ? byId : null;
}

function getThemeClass(slide: Slide) {
  return themeClasses[slide.theme ?? "lime"];
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type PresentationAppProps = {
  initialSlideTarget: string | null;
};

export function PresentationApp({ initialSlideTarget }: PresentationAppProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [presentationMode, setPresentationMode] = useState(false);
  const [overviewMode, setOverviewMode] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [showJumpPalette, setShowJumpPalette] = useState(false);
  const [jumpValue, setJumpValue] = useState("");
  const [quizProgress, setQuizProgress] = useState<QuizProgress>({});
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [liveSessionCode, setLiveSessionCode] = useState<string | null>(null);
  const [presenterSecret, setPresenterSecret] = useState<string | null>(null);
  const [presenterId, setPresenterId] = useState("presenter");
  const [liveState, setLiveState] = useState<RealtimeSessionState | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const jumpInputRef = useRef<HTMLInputElement>(null);
  const hasBootstrappedRef = useRef(false);
  const liveSocketRef = useRef<WebSocket | null>(null);
  const currentIndexRef = useRef(0);

  const currentSlide = slides[currentIndex];
  const answeredQuizCount = quizSlides.filter((slide) => quizProgress[slide.id]?.revealed).length;
  const score = quizSlides.filter((slide) => {
    const state = quizProgress[slide.id];
    return state?.revealed && state.selectedId === slide.answerId;
  }).length;
  const currentLiveQuestion = liveState?.questions[currentSlide.id] ?? null;
  const liveJoinUrl = liveSessionCode ? buildJoinUrl(liveSessionCode) : "";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const fromQuery = getIndexFromTarget(initialSlideTarget);

      if (fromQuery !== null) {
        setCurrentIndex(fromQuery);
      } else {
        const storedIndex = window.localStorage.getItem(CURRENT_SLIDE_KEY);
        if (storedIndex) {
          const parsed = Number(storedIndex);
          if (Number.isInteger(parsed)) {
            setCurrentIndex(clampIndex(parsed));
          }
        }
      }

      const storedQuizProgress = window.localStorage.getItem(QUIZ_PROGRESS_KEY);
      if (storedQuizProgress) {
        try {
          setQuizProgress(JSON.parse(storedQuizProgress) as QuizProgress);
        } catch {
          window.localStorage.removeItem(QUIZ_PROGRESS_KEY);
        }
      }

      const storedTimer = window.localStorage.getItem(TIMER_KEY);
      if (storedTimer) {
        const parsed = Number(storedTimer);
        if (Number.isFinite(parsed) && parsed > 0) {
          setTimerStartedAt(parsed);
        }
      }

      const storedSessionCode = window.localStorage.getItem(LIVE_SESSION_CODE_KEY);
      if (storedSessionCode) {
        setLiveSessionCode(storedSessionCode);
      }

      const storedPresenterSecret = window.localStorage.getItem(LIVE_PRESENTER_SECRET_KEY);
      if (storedPresenterSecret) {
        setPresenterSecret(storedPresenterSecret);
      }

      setPresenterId(
        getOrCreateStoredValue(LIVE_PRESENTER_ID_KEY, () =>
          `presenter-${randomCode(8).toLowerCase()}`,
        ),
      );

      hasBootstrappedRef.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [initialSlideTarget]);

  useEffect(() => {
    if (!hasBootstrappedRef.current) {
      return;
    }

    window.localStorage.setItem(CURRENT_SLIDE_KEY, String(currentIndex));

    const params = new URLSearchParams(window.location.search);
    params.set("slide", currentSlide.id);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    startTransition(() => {
      window.history.replaceState(null, "", nextUrl);
    });
  }, [currentIndex, currentSlide.id]);

  useEffect(() => {
    if (!hasBootstrappedRef.current) {
      return;
    }

    window.localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(quizProgress));
  }, [quizProgress]);

  useEffect(() => {
    if (!timerStartedAt) {
      window.localStorage.removeItem(TIMER_KEY);
      return;
    }

    window.localStorage.setItem(TIMER_KEY, String(timerStartedAt));
    const updateElapsed = () => {
      setElapsed(Date.now() - timerStartedAt);
    };

    const frame = window.requestAnimationFrame(updateElapsed);

    const interval = window.setInterval(() => {
      updateElapsed();
    }, 1000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, [timerStartedAt]);

  useEffect(() => {
    if (showJumpPalette) {
      jumpInputRef.current?.focus();
    }
  }, [showJumpPalette]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const navigateTo = (targetIndex: number) => {
    const nextIndex = clampIndex(targetIndex);
    if (nextIndex === currentIndex) {
      return;
    }

    setDirection(nextIndex > currentIndex ? 1 : -1);
    setCurrentIndex(nextIndex);
  };

  const stepSlide = (delta: number) => {
    navigateTo(currentIndex + delta);
  };

  useEffect(() => {
    if (!hasBootstrappedRef.current) {
      return;
    }

    if (liveSessionCode) {
      window.localStorage.setItem(LIVE_SESSION_CODE_KEY, liveSessionCode);
    } else {
      window.localStorage.removeItem(LIVE_SESSION_CODE_KEY);
    }
  }, [liveSessionCode]);

  useEffect(() => {
    if (!hasBootstrappedRef.current) {
      return;
    }

    if (presenterSecret) {
      window.localStorage.setItem(LIVE_PRESENTER_SECRET_KEY, presenterSecret);
    } else {
      window.localStorage.removeItem(LIVE_PRESENTER_SECRET_KEY);
    }
  }, [presenterSecret]);

  const sendLiveMessage = useCallback((message: ClientMessage) => {
    const socket = liveSocketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(message));
  }, []);

  useEffect(() => {
    if (!liveSessionCode || !presenterSecret || !presenterId) {
      return;
    }

    const socket = createPartySocket(liveSessionCode);
    if (!socket) {
      return;
    }

    liveSocketRef.current = socket;

    socket.addEventListener("open", () => {
      setLiveConnected(true);
      setLiveError(null);
      socket.send(
        JSON.stringify({
          type: "register",
          role: "presenter",
          participantId: presenterId,
          name: "Presenter",
          presenterSecret,
        } satisfies ClientMessage),
      );
    });

    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        if (message.type === "session_state") {
          setLiveState(message.state);
          setLiveError(null);
          const nextIndex = getIndexFromTarget(message.state.currentSlideId);
          if (nextIndex !== null && nextIndex !== currentIndexRef.current) {
            setDirection(nextIndex > currentIndexRef.current ? 1 : -1);
            setCurrentIndex(nextIndex);
          }
        } else if (message.type === "error") {
          setLiveError(message.message);
        }
      } catch {
        setLiveError("Received an invalid realtime message.");
      }
    });

    socket.addEventListener("close", () => {
      setLiveConnected(false);
    });

    socket.addEventListener("error", () => {
      setLiveError("Unable to connect to PartyKit.");
    });

    return () => {
      liveSocketRef.current = null;
      socket.close();
    };
  }, [liveSessionCode, presenterSecret, presenterId]);

  useEffect(() => {
    if (!liveConnected || !liveSessionCode || !presenterSecret) {
      return;
    }

    sendLiveMessage({
      type: "slide_set",
      slideId: currentSlide.id,
      presenterSecret,
    });
  }, [
    currentSlide.id,
    liveConnected,
    liveSessionCode,
    presenterSecret,
    sendLiveMessage,
  ]);

  const handleQuizSelect = (slideId: string, optionId: string) => {
    setQuizProgress((current) => ({
      ...current,
      [slideId]: {
        selectedId: optionId,
        revealed: current[slideId]?.revealed ?? false,
      },
    }));
  };

  const handleQuizReveal = (slideId: string) => {
    setQuizProgress((current) => {
      const existing = current[slideId];
      if (!existing?.selectedId) {
        return current;
      }

      return {
        ...current,
        [slideId]: {
          ...existing,
          revealed: true,
        },
      };
    });
  };

  const resetQuiz = () => {
    setQuizProgress({});
    window.localStorage.removeItem(QUIZ_PROGRESS_KEY);
  };

  const startLiveSession = () => {
    if (!getPartyHost()) {
      setLiveError("Missing NEXT_PUBLIC_PARTYKIT_HOST.");
      return;
    }

    const nextCode = randomCode(4);
    const nextSecret = randomSecret(24);
    setLiveState(null);
    setLiveError(null);
    setLiveSessionCode(nextCode);
    setPresenterSecret(nextSecret);
  };

  const stopLiveSession = () => {
    liveSocketRef.current?.close();
    setLiveConnected(false);
    setLiveState(null);
    setLiveSessionCode(null);
    setPresenterSecret(null);
    setLiveError(null);
  };

  const revealLiveQuestion = () => {
    if (!presenterSecret || currentSlide.kind !== "quiz") {
      return;
    }

    sendLiveMessage({
      type: "question_reveal",
      slideId: currentSlide.id,
      presenterSecret,
    });
  };

  const resetLiveQuestion = () => {
    if (!presenterSecret || currentSlide.kind !== "quiz") {
      return;
    }

    sendLiveMessage({
      type: "question_reset",
      slideId: currentSlide.id,
      presenterSecret,
    });
  };

  const displayedElapsed = timerStartedAt ? elapsed : 0;

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const isInputTarget =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable;

    if (showJumpPalette && event.key === "Escape") {
      setShowJumpPalette(false);
      setJumpValue("");
      return;
    }

    if (isInputTarget) {
      return;
    }

    if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
      event.preventDefault();
      stepSlide(1);
    } else if (
      event.key === "ArrowLeft" ||
      event.key === "Backspace" ||
      event.key === "PageUp"
    ) {
      event.preventDefault();
      stepSlide(-1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      stepSlide(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      stepSlide(-1);
    } else if (event.key.toLowerCase() === "o") {
      event.preventDefault();
      setOverviewMode((current) => !current);
    } else if (event.key.toLowerCase() === "h") {
      event.preventDefault();
      setShowHints((current) => !current);
    } else if (event.key.toLowerCase() === "p") {
      event.preventDefault();
      setPresentationMode((current) => !current);
    } else if (event.key.toLowerCase() === "j" || event.key === "/") {
      event.preventDefault();
      setShowJumpPalette(true);
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      resetQuiz();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const progress = ((currentIndex + 1) / slides.length) * 100;

  return (
    <main className={`relative min-h-screen overflow-hidden ${getThemeClass(currentSlide)}`}>
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => stepSlide(-1)}
        className="absolute inset-y-0 left-0 z-20 hidden w-24 cursor-w-resize bg-gradient-to-r from-black/12 to-transparent lg:block"
      />
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => stepSlide(1)}
        className="absolute inset-y-0 right-0 z-20 hidden w-24 cursor-e-resize bg-gradient-to-l from-black/12 to-transparent lg:block"
      />

      <div className={`${presentationMode ? "px-6 py-6 md:px-8 md:py-8" : "px-6 py-6 md:px-10 md:py-8"}`}>
        {!presentationMode ? (
          <header className="mb-4 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-current/62">
              <div className="rounded-full bg-[#d6ff35] px-3 py-2">
                <Image
                  src="/branding/slice-logo.svg"
                  alt="Slice"
                  width={72}
                  height={24}
                  className="h-4 w-auto"
                />
              </div>
              <span className="h-px w-8 bg-current/25" />
              <span>{currentSlide.id}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-current/62">
              <button
                type="button"
                onClick={() => setOverviewMode((current) => !current)}
                className="border border-current/20 px-3 py-2 transition hover:border-current hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setPresentationMode((current) => !current)}
                className="border border-current/20 px-3 py-2 transition hover:border-current hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              >
                Clean mode
              </button>
              <button
                type="button"
                onClick={() => setShowJumpPalette(true)}
                className="border border-current/20 px-3 py-2 transition hover:border-current hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              >
                Jump
              </button>
            </div>
          </header>
        ) : null}

        <div className="relative">
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            <motion.section
              key={currentSlide.id}
              custom={direction}
              initial={{ x: direction > 0 ? 140 : -140, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? -120 : 120, opacity: 0 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className={`relative min-h-[calc(100vh-5rem)] overflow-hidden border border-current/18 ${
                presentationMode ? "min-h-[calc(100vh-3rem)]" : ""
              }`}
            >
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 top-0 z-10 h-full w-full origin-left bg-black/6"
                style={{ clipPath: "polygon(0 0, 14% 0, 10% 100%, 0 100%)" }}
              />
              <div className="relative z-20 h-full min-h-[inherit] px-6 py-6 md:px-10 md:py-8 xl:px-14 xl:py-10">
                <SlideRenderer
                  slide={currentSlide}
                  index={currentIndex}
                  total={slides.length}
                  quizState={quizProgress[currentSlide.id]}
                  onQuizSelect={handleQuizSelect}
                  onQuizReveal={handleQuizReveal}
                />
              </div>
            </motion.section>
          </AnimatePresence>

          <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-30 flex items-end justify-between gap-6">
            <div className="pointer-events-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => stepSlide(-1)}
                className="border border-current/24 bg-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] transition hover:border-current hover:bg-black/18 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => stepSlide(1)}
                className="border border-current/24 bg-black px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#d6ff35] transition hover:bg-[#171717] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              >
                Next
              </button>
            </div>

            <div className="flex min-w-56 flex-col items-end gap-3">
              <div className="text-right text-xs font-semibold uppercase tracking-[0.24em] text-current/62">
                Slide {currentIndex + 1} of {slides.length}
              </div>
              <div className="h-2 w-full max-w-56 overflow-hidden border border-current/25 bg-black/8">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-full bg-current"
                />
              </div>
            </div>
          </div>
        </div>

        {!presentationMode && showHints ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-current/55">
            <div className="flex flex-wrap items-center gap-4">
              <span>Arrows / space: navigate</span>
              <span>O: overview</span>
              <span>J or /: jump</span>
              <span>P: clean mode</span>
              <span>H: hide hints</span>
              <span>R: reset quiz</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Quiz score {score}/{quizSlides.length}
              </span>
              <span>
                Revealed {answeredQuizCount}/{quizSlides.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setTimerStartedAt((current) => (current ? null : Date.now()))
                }
                className="border border-current/20 px-3 py-2 transition hover:border-current hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              >
                {timerStartedAt ? `Timer ${formatElapsed(displayedElapsed)}` : "Start timer"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {overviewMode ? (
        <div className="absolute inset-0 z-40 overflow-auto bg-black/92 p-6 text-[#d6ff35] md:p-10">
          <div className="mb-6 flex items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d6ff35]/55">
                Overview mode
              </p>
              <h2 className="font-display text-5xl uppercase leading-none tracking-[-0.06em] md:text-6xl">
                All slides at a glance
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOverviewMode(false)}
              className="border border-[#d6ff35]/25 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] transition hover:border-[#d6ff35] hover:bg-white/6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6ff35]"
            >
              Close
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => {
                  navigateTo(index);
                  setOverviewMode(false);
                }}
                className={`min-h-48 border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6ff35] ${
                  index === currentIndex
                    ? "border-[#d6ff35] bg-white/8"
                    : "border-[#d6ff35]/20 bg-white/[0.03] hover:border-[#d6ff35]/60 hover:bg-white/[0.06]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#d6ff35]/58">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-4 font-display text-4xl uppercase leading-[0.92] tracking-[-0.06em]">
                  {slide.title}
                </p>
                <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[#d6ff35]/55">
                  {slide.id}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showJumpPalette ? (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/70 p-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const nextIndex = getIndexFromTarget(jumpValue.trim());
              if (nextIndex !== null) {
                navigateTo(nextIndex);
                setShowJumpPalette(false);
                setJumpValue("");
              }
            }}
            className="w-full max-w-xl border border-[#d6ff35]/20 bg-[#111111] p-5 text-[#d6ff35]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#d6ff35]/55">
              Jump to slide
            </p>
            <input
              ref={jumpInputRef}
              value={jumpValue}
              onChange={(event) => setJumpValue(event.target.value)}
              placeholder="Enter slide number or id"
              className="mt-4 w-full border border-[#d6ff35]/18 bg-transparent px-4 py-4 font-display text-4xl uppercase tracking-[-0.05em] focus:border-[#d6ff35] focus:outline-none"
            />
            <div className="mt-4 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/55">
              <span>Examples: 7 or workflow</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowJumpPalette(false);
                    setJumpValue("");
                  }}
                  className="border border-[#d6ff35]/18 px-3 py-2 transition hover:border-[#d6ff35] hover:bg-white/6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6ff35]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="border border-[#d6ff35] bg-[#d6ff35] px-3 py-2 text-black transition hover:bg-[#c2f11a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6ff35]"
                >
                  Go
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      <LiveSessionPanel
        currentSlide={currentSlide}
        sessionCode={liveSessionCode}
        joinUrl={liveJoinUrl}
        connected={liveConnected}
        error={liveError}
        state={liveState}
        currentQuestion={currentLiveQuestion}
        onStart={startLiveSession}
        onStop={stopLiveSession}
        onReveal={revealLiveQuestion}
        onReset={resetLiveQuestion}
      />

      {!presentationMode && currentSlide.speakerNotes ? (
        <aside className="absolute right-6 top-24 z-30 hidden max-w-sm border border-current/20 bg-black/90 p-4 text-[#d6ff35] xl:block">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/58">
            Presenter notes
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#d6ff35]/82">
            {currentSlide.speakerNotes}
          </p>
        </aside>
      ) : null}
    </main>
  );
}
