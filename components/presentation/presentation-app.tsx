"use client";

import Image from "next/image";
import {
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import { LiveSessionPanel } from "@/components/presentation/live-session-panel";
import { BuildLoopView } from "@/components/presentation/build-loop-view";
import { SlideRenderer } from "@/components/presentation/slide-renderer";
import type { DeckId, QuizProgress, Slide, SlideTheme } from "@/components/presentation/types";
import {
  decks,
  getDeckById,
  getDefaultDeck,
  getDeckIdForSlide,
  getSlideById,
  quizSlides,
  resolveDeckAndSlide,
} from "@/lib/presentation";
import {
  buildJoinUrl,
  buildRemoteUrl,
  createPartySocket,
  getPartyHost,
  getOrCreateStoredValue,
  randomCode,
  randomSecret,
} from "@/lib/realtime/client";
import type {
  ClientMessage,
  RealtimeFacilitationTimerState,
  RealtimeSessionState,
  ServerMessage,
} from "@/lib/realtime/protocol";

const CURRENT_DECK_KEY = "slice-ai-current-deck";
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

function clampIndex(index: number, total: number) {
  return Math.min(Math.max(index, 0), Math.max(total - 1, 0));
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
  initialDeckTarget: string | null;
  initialSlideTarget: string | null;
};

export function PresentationApp({
  initialDeckTarget,
  initialSlideTarget,
}: PresentationAppProps) {
  const [currentDeckId, setCurrentDeckId] = useState<DeckId>(getDefaultDeck().id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [presentationMode, setPresentationMode] = useState(true);
  const [overviewMode, setOverviewMode] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [showLivePanelMode, setShowLivePanelMode] = useState<"audience" | "remote" | null>(null);
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
  const currentDeckIdRef = useRef<DeckId>(getDefaultDeck().id);

  const currentDeck = useMemo(
    () => getDeckById(currentDeckId) ?? getDefaultDeck(),
    [currentDeckId],
  );
  const currentSlides = currentDeck.slides;
  const currentSlide = currentSlides[currentIndex] ?? currentSlides[0];
  const isDarkSlide = currentSlide.theme === "ink" || currentSlide.theme === "pink";
  const timerSourceStartedAt = liveState?.facilitationTimer?.startedAt ?? timerStartedAt;
  const answeredQuizCount = quizSlides.filter((slide) => quizProgress[slide.id]?.revealed).length;
  const score = quizSlides.filter((slide) => {
    const state = quizProgress[slide.id];
    return state?.revealed && state.selectedId === slide.correctAnswer;
  }).length;
  const audienceParticipantCount =
    liveState?.participants.filter((participant) => !participant.id.startsWith("presenter-"))
      .length ?? 0;
  const currentLiveQuestion = liveState?.questions[currentSlide.id] ?? null;
  const liveJoinUrl = liveSessionCode ? buildJoinUrl(liveSessionCode) : "";
  const remoteJoinUrl =
    liveSessionCode && presenterSecret ? buildRemoteUrl(liveSessionCode, presenterSecret) : "";
  const isBuildLoopMode = liveState?.displayMode === "build-loop";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedDeck = window.localStorage.getItem(CURRENT_DECK_KEY);
      const storedSlide = window.localStorage.getItem(CURRENT_SLIDE_KEY);
      const resolved = resolveDeckAndSlide(
        initialDeckTarget ?? storedDeck,
        initialSlideTarget ?? storedSlide,
      );

      setCurrentDeckId(resolved.deck.id);
      setCurrentIndex(resolved.index);

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
  }, [initialDeckTarget, initialSlideTarget]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    currentDeckIdRef.current = currentDeck.id;
  }, [currentDeck.id, currentIndex]);

  useEffect(() => {
    if (!hasBootstrappedRef.current || !currentSlide) {
      return;
    }

    window.localStorage.setItem(CURRENT_DECK_KEY, currentDeck.id);
    window.localStorage.setItem(CURRENT_SLIDE_KEY, currentSlide.id);

    const params = new URLSearchParams(window.location.search);
    params.set("deck", currentDeck.id);
    params.set("slide", currentSlide.id);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    startTransition(() => {
      window.history.replaceState(null, "", nextUrl);
    });
  }, [currentDeck.id, currentSlide]);

  useEffect(() => {
    if (!hasBootstrappedRef.current) {
      return;
    }

    window.localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(quizProgress));
  }, [quizProgress]);

  useEffect(() => {
    if (!timerSourceStartedAt) {
      window.localStorage.removeItem(TIMER_KEY);
      return;
    }

    if (!liveState?.facilitationTimer?.startedAt) {
      window.localStorage.setItem(TIMER_KEY, String(timerSourceStartedAt));
    }

    const updateElapsed = () => {
      setElapsed(Date.now() - timerSourceStartedAt);
    };

    const frame = window.requestAnimationFrame(updateElapsed);
    const interval = window.setInterval(updateElapsed, 1000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, [liveState?.facilitationTimer?.startedAt, timerSourceStartedAt]);

  useEffect(() => {
    if (showJumpPalette) {
      jumpInputRef.current?.focus();
    }
  }, [showJumpPalette]);

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

  const navigateTo = useCallback(
    (targetIndex: number, targetDeckId?: DeckId) => {
      const nextDeck = getDeckById(targetDeckId ?? currentDeck.id) ?? currentDeck;
      const nextIndex = clampIndex(targetIndex, nextDeck.slides.length);
      const sameDeck = nextDeck.id === currentDeck.id;

      if (sameDeck && nextIndex === currentIndex) {
        return;
      }

      setDirection(sameDeck ? (nextIndex > currentIndex ? 1 : -1) : 1);
      setCurrentDeckId(nextDeck.id);
      setCurrentIndex(nextIndex);
    },
    [currentDeck, currentIndex],
  );

  const stepSlide = useCallback(
    (delta: number) => {
      navigateTo(currentIndex + delta);
    },
    [currentIndex, navigateTo],
  );

  const switchDeck = (deckId: DeckId) => {
    navigateTo(0, deckId);
  };

  const getIndexFromTarget = useCallback(
    (target: string | null) => {
      if (!target) {
        return null;
      }

      const numeric = Number(target);
      if (
        Number.isInteger(numeric) &&
        numeric >= 1 &&
        numeric <= currentDeck.slides.length
      ) {
        return numeric - 1;
      }

      const byId = currentDeck.slides.findIndex((slide) => slide.id === target);
      return byId >= 0 ? byId : null;
    },
    [currentDeck.slides],
  );

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
          const nextDeckId = getDeckIdForSlide(message.state.currentSlideId);
          const nextSlide = getSlideById(message.state.currentSlideId, nextDeckId);
          if (!nextDeckId || !nextSlide) {
            return;
          }

          const nextDeck = getDeckById(nextDeckId);
          const nextIndex =
            nextDeck?.slides.findIndex((slide) => slide.id === nextSlide.id) ?? -1;
          if (nextDeck && nextIndex >= 0) {
            const sameDeck = nextDeck.id === currentDeckIdRef.current;
            setDirection(sameDeck && nextIndex < currentIndexRef.current ? -1 : 1);
            setCurrentDeckId(nextDeck.id);
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
    if (!liveConnected || !presenterSecret || !currentSlide) {
      return;
    }

    sendLiveMessage({
      type: "slide_set",
      slideId: currentSlide.id,
      presenterSecret,
    });
  }, [currentSlide, liveConnected, presenterSecret, sendLiveMessage]);

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

  const localFacilitationTimer: RealtimeFacilitationTimerState | null =
    timerStartedAt && currentSlide.id === "team-formation"
      ? {
          slideId: "team-formation",
          durationMs: 15 * 60 * 1000,
          startedAt: timerStartedAt,
          status: "running",
          updatedAt: timerStartedAt,
        }
      : null;
  const activeFacilitationTimer =
    liveState?.facilitationTimer && liveState.facilitationTimer.status !== "idle"
      ? liveState.facilitationTimer
      : localFacilitationTimer;
  const displayedElapsed = activeFacilitationTimer?.startedAt ? elapsed : 0;

  const startFacilitationTimer = () => {
    if (liveConnected && presenterSecret) {
      sendLiveMessage({
        type: "timer_start",
        slideId: "team-formation",
        durationMs: 15 * 60 * 1000,
        presenterSecret,
      });
      return;
    }

    setTimerStartedAt(Date.now());
  };

  const resetFacilitationTimer = () => {
    if (liveConnected && presenterSecret) {
      sendLiveMessage({
        type: "timer_reset",
        presenterSecret,
      });
      return;
    }

    setTimerStartedAt(null);
  };

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
    } else if (event.key.toLowerCase() === "m" || event.key.toLowerCase() === "p") {
      event.preventDefault();
      setPresentationMode((current) => !current);
    } else if (event.key.toLowerCase() === "j" || event.key === "/") {
      event.preventDefault();
      setShowJumpPalette(true);
    } else if (event.key.toLowerCase() === "q") {
      event.preventDefault();
      setShowLivePanelMode((current) => (current === "audience" ? null : "audience"));
    } else if (event.key.toLowerCase() === "w") {
      event.preventDefault();
      setShowLivePanelMode((current) => (current === "remote" ? null : "remote"));
    } else if (event.key.toLowerCase() === "v") {
      event.preventDefault();
      if (liveSessionCode && currentSlide.kind === "quiz") {
        revealLiveQuestion();
      } else if (currentSlide.kind === "quiz") {
        handleQuizReveal(currentSlide.id);
      }
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      resetQuiz();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const progress = ((currentIndex + 1) / currentSlides.length) * 100;

  if (isBuildLoopMode) {
    return <BuildLoopView />;
  }

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

      <div
        className={`${presentationMode ? "grid min-h-screen place-items-center px-6 py-6 md:px-8 md:py-8" : "px-6 py-6 md:px-10 md:py-8"}`}
      >
        {!presentationMode ? (
          <header className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-current/62">
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
              <span>{currentDeck.title}</span>
              <span className="h-px w-8 bg-current/25" />
              <span>{currentSlide.id}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-current/62">
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => switchDeck(deck.id)}
                  className={`border px-3 py-2 transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current ${
                    deck.id === currentDeck.id
                      ? "border-current bg-black/10"
                      : "border-current/20 hover:border-current hover:bg-black/5"
                  }`}
                >
                  {deck.title}
                </button>
              ))}
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
                Hide menu
              </button>
              <button
                type="button"
                onClick={() => setShowJumpPalette(true)}
                className="border border-current/20 px-3 py-2 transition hover:border-current hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              >
                Jump
              </button>
              <button
                type="button"
                onClick={() =>
                  setShowLivePanelMode((current) => (current === "audience" ? null : "audience"))
                }
                className="border border-current/20 px-3 py-2 transition hover:border-current hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              >
                Live QR
              </button>
              <button
                type="button"
                onClick={() =>
                  setShowLivePanelMode((current) => (current === "remote" ? null : "remote"))
                }
                className="border border-current/20 px-3 py-2 transition hover:border-current hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              >
                Remote QR
              </button>
              {liveSessionCode && currentSlide.kind === "quiz" ? (
                <>
                  <button
                    type="button"
                    onClick={revealLiveQuestion}
                    className="border border-current px-3 py-2 transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                  >
                    Reveal live
                  </button>
                  <button
                    type="button"
                    onClick={resetLiveQuestion}
                    className="border border-current/20 px-3 py-2 transition hover:border-current hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                  >
                    Reset live
                  </button>
                </>
              ) : null}
            </div>
          </header>
        ) : null}

        <div
          className={`relative ${presentationMode ? "aspect-[16/9]" : ""}`}
          style={
            presentationMode
              ? {
                  width: "min(calc(100vw - 3rem), calc((100vh - 3rem) * 16 / 9))",
                }
              : undefined
          }
        >
          <AnimatePresence initial={false} mode="wait" custom={`${currentDeck.id}:${direction}`}>
            <motion.section
              key={`${currentDeck.id}:${currentSlide.id}`}
              custom={direction}
              initial={{ x: direction > 0 ? 140 : -140, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? -120 : 120, opacity: 0 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className={`relative overflow-hidden border border-current/18 ${
                presentationMode ? "h-full" : "min-h-[calc(100vh-5rem)]"
              }`}
            >
              <div className="relative z-20 flex h-full flex-col px-6 py-6 md:px-10 md:py-8 xl:px-14 xl:py-10">
                <div className="min-h-0 flex-1">
                  <SlideRenderer
                    slide={currentSlide}
                    index={currentIndex}
                    total={currentSlides.length}
                    quizState={quizProgress[currentSlide.id]}
                    facilitationTimer={activeFacilitationTimer}
                    liveQuestion={currentLiveQuestion}
                    participantCount={audienceParticipantCount}
                    sessionCode={liveSessionCode}
                    liveConnected={liveConnected}
                    onQuizSelect={handleQuizSelect}
                    onQuizReveal={handleQuizReveal}
                  />
                </div>

                <div className="mt-4 flex items-end justify-between gap-6 pt-3">
                  <div className="flex items-center rounded-full border border-current/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <Image
                      src="/branding/slice-logo.svg"
                      alt="Slice"
                      width={84}
                      height={28}
                      className={`h-4 w-auto ${isDarkSlide ? "brightness-0 invert" : ""}`}
                    />
                  </div>

                  <div className="flex min-w-56 flex-col items-end gap-3">
                    <div className="text-right text-xs font-semibold uppercase tracking-[0.24em] text-current/62">
                      {currentDeck.title} • Slide {currentIndex + 1} of {currentSlides.length}
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
            </motion.section>
          </AnimatePresence>
        </div>

        {!presentationMode && showHints ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-current/55">
            <div className="flex flex-wrap items-center gap-4">
              <span>Arrows / space: navigate</span>
              <span>O: overview</span>
              <span>J or /: jump</span>
              <span>Q: live QR</span>
              <span>W: remote QR</span>
              <span>V: reveal answer</span>
              <span>M / P: toggle menu</span>
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
                  activeFacilitationTimer ? resetFacilitationTimer() : startFacilitationTimer()
                }
                className="border border-current/20 px-3 py-2 transition hover:border-current hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              >
                {activeFacilitationTimer
                  ? `Idea timer ${formatElapsed(displayedElapsed)}`
                  : "Start idea timer"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {overviewMode ? (
        <div className="absolute inset-0 z-40 overflow-auto bg-black/92 p-6 text-[#d6ff35] md:p-10">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d6ff35]/55">
                Overview mode
              </p>
              <h2 className="font-display text-5xl uppercase leading-none tracking-[-0.06em] md:text-6xl">
                Decks at a glance
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

          <div className="space-y-8">
            {decks.map((deck) => (
              <section key={deck.id}>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="font-display text-4xl uppercase leading-none tracking-[-0.05em]">
                    {deck.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      switchDeck(deck.id);
                      setOverviewMode(false);
                    }}
                    className="border border-[#d6ff35]/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition hover:border-[#d6ff35] hover:bg-white/6"
                  >
                    Open deck
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {deck.slides.map((slide, index) => {
                    const active = deck.id === currentDeck.id && index === currentIndex;

                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => {
                          navigateTo(index, deck.id);
                          setOverviewMode(false);
                        }}
                        className={`min-h-48 border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6ff35] ${
                          active
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
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}

      {showJumpPalette ? (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/70 p-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = jumpValue.trim();
              const nextIndex = getIndexFromTarget(trimmed);
              if (nextIndex !== null) {
                navigateTo(nextIndex);
                setShowJumpPalette(false);
                setJumpValue("");
                return;
              }

              const resolvedDeck = getDeckById(trimmed);
              if (resolvedDeck) {
                navigateTo(0, resolvedDeck.id);
                setShowJumpPalette(false);
                setJumpValue("");
              }
            }}
            className="w-full max-w-xl border border-[#d6ff35]/20 bg-[#111111] p-5 text-[#d6ff35]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#d6ff35]/55">
              Jump within current deck
            </p>
            <input
              ref={jumpInputRef}
              value={jumpValue}
              onChange={(event) => setJumpValue(event.target.value)}
              placeholder="Enter slide number, slide id, or deck id"
              className="mt-4 w-full border border-[#d6ff35]/18 bg-transparent px-4 py-4 font-display text-4xl uppercase tracking-[-0.05em] focus:border-[#d6ff35] focus:outline-none"
            />
            <div className="mt-4 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff35]/55">
              <span>Examples: 3, quiz-agent, day2-demos</span>
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
        visible={showLivePanelMode !== null}
        mode={showLivePanelMode ?? "audience"}
        currentSlide={currentSlide}
        sessionCode={liveSessionCode}
        joinUrl={showLivePanelMode === "remote" ? remoteJoinUrl : liveJoinUrl}
        connected={liveConnected}
        error={liveError}
        state={liveState}
        participantCount={audienceParticipantCount}
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
