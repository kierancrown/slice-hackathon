import { quizSlides, quizSlidesById } from "@/lib/presentation";

export type RealtimeParticipant = {
  id: string;
  name: string;
  joinedAt: number;
};

export type RealtimeQuestionState = {
  slideId: string;
  status: "idle" | "open" | "revealed";
  votes: Record<string, string>;
  totals: Record<string, number>;
  totalVotes: number;
  answerId: string;
  updatedAt: number;
};

export type RealtimeFacilitationTimerState = {
  slideId: string | null;
  durationMs: number;
  startedAt: number | null;
  status: "idle" | "running" | "completed";
  updatedAt: number;
};

export type RealtimeSessionState = {
  sessionCode: string;
  presenterSecret: string;
  currentSlideId: string;
  activeQuestionSlideId: string | null;
  participants: RealtimeParticipant[];
  questions: Record<string, RealtimeQuestionState>;
  facilitationTimer: RealtimeFacilitationTimerState;
  updatedAt: number;
};

export type RegisterMessage = {
  type: "register";
  role: "presenter" | "audience";
  participantId: string;
  name?: string;
  presenterSecret?: string;
};

export type SetNameMessage = {
  type: "set_name";
  participantId: string;
  name: string;
};

export type SlideSetMessage = {
  type: "slide_set";
  slideId: string;
  presenterSecret: string;
};

export type VoteSubmitMessage = {
  type: "vote_submit";
  slideId: string;
  optionId: string;
  participantId: string;
};

export type QuestionRevealMessage = {
  type: "question_reveal";
  slideId: string;
  presenterSecret: string;
};

export type QuestionResetMessage = {
  type: "question_reset";
  slideId: string;
  presenterSecret: string;
};

export type TimerStartMessage = {
  type: "timer_start";
  slideId: string;
  durationMs: number;
  presenterSecret: string;
};

export type TimerResetMessage = {
  type: "timer_reset";
  presenterSecret: string;
};

export type PingMessage = {
  type: "ping";
};

export type ClientMessage =
  | RegisterMessage
  | SetNameMessage
  | SlideSetMessage
  | VoteSubmitMessage
  | QuestionRevealMessage
  | QuestionResetMessage
  | TimerStartMessage
  | TimerResetMessage
  | PingMessage;

export type SessionStateMessage = {
  type: "session_state";
  state: RealtimeSessionState;
};

export type ParticipantsUpdatedMessage = {
  type: "participants_updated";
  participants: RealtimeParticipant[];
};

export type SlideChangedMessage = {
  type: "slide_changed";
  slideId: string;
  activeQuestionSlideId: string | null;
};

export type QuestionStateMessage = {
  type: "question_state";
  question: RealtimeQuestionState;
};

export type ErrorMessage = {
  type: "error";
  message: string;
};

export type ServerMessage =
  | SessionStateMessage
  | ParticipantsUpdatedMessage
  | SlideChangedMessage
  | QuestionStateMessage
  | ErrorMessage;

export const realtimeQuizSlides = quizSlides;

export const realtimeQuizSlidesById = quizSlidesById;

export function createEmptyQuestionState(slideId: string): RealtimeQuestionState | null {
  const slide = realtimeQuizSlidesById.get(slideId);
  if (!slide) {
    return null;
  }

  const totals = Object.fromEntries(slide.answers.map((option) => [option.id, 0]));

  return {
    slideId,
    status: "idle",
    votes: {},
    totals,
    totalVotes: 0,
    answerId: slide.correctAnswer,
    updatedAt: Date.now(),
  };
}

export function recomputeTotals(
  slideId: string,
  votes: Record<string, string>,
): RealtimeQuestionState | null {
  const base = createEmptyQuestionState(slideId);
  if (!base) {
    return null;
  }

  const totals = { ...base.totals };
  for (const optionId of Object.values(votes)) {
    if (Object.hasOwn(totals, optionId)) {
      totals[optionId] += 1;
    }
  }

  return {
    ...base,
    votes,
    totals,
    totalVotes: Object.keys(votes).length,
    updatedAt: Date.now(),
  };
}

export function isClientMessage(value: unknown): value is ClientMessage {
  return Boolean(
    value &&
      typeof value === "object" &&
      "type" in value &&
      typeof (value as { type?: unknown }).type === "string",
  );
}

export function createIdleFacilitationTimerState(): RealtimeFacilitationTimerState {
  return {
    slideId: null,
    durationMs: 0,
    startedAt: null,
    status: "idle",
    updatedAt: Date.now(),
  };
}
