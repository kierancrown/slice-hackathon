import type { QuizSlide } from "@/components/presentation/types";
import { slides } from "@/data/slides";

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

export type RealtimeSessionState = {
  sessionCode: string;
  presenterSecret: string;
  currentSlideId: string;
  activeQuestionSlideId: string | null;
  participants: RealtimeParticipant[];
  questions: Record<string, RealtimeQuestionState>;
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

export const realtimeQuizSlides = slides.filter(
  (slide): slide is QuizSlide => slide.kind === "quiz",
);

export const realtimeQuizSlidesById = new Map(
  realtimeQuizSlides.map((slide) => [slide.id, slide] as const),
);

export function createEmptyQuestionState(slideId: string): RealtimeQuestionState | null {
  const slide = realtimeQuizSlidesById.get(slideId);
  if (!slide) {
    return null;
  }

  const totals = Object.fromEntries(slide.options.map((option) => [option.id, 0]));

  return {
    slideId,
    status: "idle",
    votes: {},
    totals,
    totalVotes: 0,
    answerId: slide.answerId,
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
