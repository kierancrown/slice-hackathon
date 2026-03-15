import { allSlides } from "../lib/presentation";
import {
  createIdleFacilitationTimerState,
  createEmptyQuestionState,
  isClientMessage,
  recomputeTotals,
  type ClientMessage,
  type RealtimeParticipant,
  type RealtimeSessionState,
  type ServerMessage,
} from "../lib/realtime/protocol";

type PartyConnection = {
  id: string;
  send: (message: string) => void;
};

type PartyRoom = {
  id: string;
  broadcast: (message: string) => void;
  storage?: {
    get: (key: string) => Promise<unknown>;
    put: (key: string, value: unknown) => Promise<void>;
  };
};

type ConnectionMeta = {
  participantId: string;
  name: string;
  role: "presenter" | "audience";
};

const DEFAULT_SLIDE_ID = allSlides[0]?.id ?? "opening";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function safeParse(message: string): ClientMessage | null {
  try {
    const parsed: unknown = JSON.parse(message);
    return isClientMessage(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function createInitialState(sessionCode: string, presenterSecret = ""): RealtimeSessionState {
  return {
    sessionCode: sessionCode.toUpperCase(),
    presenterSecret,
    displayMode: "slides",
    currentSlideId: DEFAULT_SLIDE_ID,
    activeQuestionSlideId: null,
    participants: [],
    questions: {},
    facilitationTimer: createIdleFacilitationTimerState(),
    updatedAt: Date.now(),
  };
}

function normalizeSessionState(
  sessionCode: string,
  state: Partial<RealtimeSessionState>,
): RealtimeSessionState {
  const initial = createInitialState(sessionCode, state.presenterSecret ?? "");

  return {
    ...initial,
    ...state,
    facilitationTimer: state.facilitationTimer ?? initial.facilitationTimer,
    participants: state.participants ?? initial.participants,
    questions: state.questions ?? initial.questions,
    displayMode: state.displayMode ?? initial.displayMode,
  };
}

export default class SessionRoom {
  room: PartyRoom;
  connections = new Map<string, ConnectionMeta>();
  state: RealtimeSessionState;

  constructor(room: PartyRoom) {
    this.room = room;
    this.state = createInitialState(room.id.replace(/^session-?/i, ""));
  }

  async onStart() {
    const stored = await this.room.storage?.get("state");
    if (isRecord(stored)) {
      this.state = normalizeSessionState(
        this.room.id.replace(/^session-?/i, ""),
        stored as Partial<RealtimeSessionState>,
      );
    }
  }

  async onConnect(connection: PartyConnection) {
    this.send(connection, {
      type: "session_state",
      state: this.state,
    });
  }

  async onClose(connection: PartyConnection) {
    this.connections.delete(connection.id);
  }

  async onMessage(message: string, connection: PartyConnection) {
    const parsed = safeParse(message);
    if (!parsed) {
      this.send(connection, { type: "error", message: "Invalid realtime payload." });
      return;
    }

    switch (parsed.type) {
      case "register":
        this.handleRegister(connection, parsed);
        return;
      case "set_name":
        this.handleSetName(connection, parsed.participantId, parsed.name);
        return;
      case "slide_set":
        this.handleSlideSet(connection, parsed);
        return;
      case "vote_submit":
        this.handleVoteSubmit(connection, parsed);
        return;
      case "question_reveal":
        this.handleQuestionReveal(connection, parsed);
        return;
      case "question_reset":
        this.handleQuestionReset(connection, parsed);
        return;
      case "timer_start":
        this.handleTimerStart(connection, parsed);
        return;
      case "timer_reset":
        this.handleTimerReset(connection, parsed);
        return;
      case "session_reset":
        this.handleSessionReset(connection, parsed);
        return;
      case "display_mode_set":
        this.handleDisplayModeSet(connection, parsed);
        return;
      case "ping":
        this.send(connection, { type: "session_state", state: this.state });
        return;
      default:
        this.send(connection, { type: "error", message: "Unsupported realtime event." });
    }
  }

  handleRegister(connection: PartyConnection, message: Extract<ClientMessage, { type: "register" }>) {
    const participantId = message.participantId.trim();
    if (!participantId) {
      this.send(connection, { type: "error", message: "Missing participant id." });
      return;
    }

    if (message.role === "presenter") {
      if (!message.presenterSecret) {
        this.send(connection, { type: "error", message: "Missing presenter secret." });
        return;
      }

      if (!this.state.presenterSecret) {
        this.state.presenterSecret = message.presenterSecret;
      }

      if (this.state.presenterSecret !== message.presenterSecret) {
        this.send(connection, { type: "error", message: "Presenter secret mismatch." });
        return;
      }
    }

    const name =
      message.name?.trim() ||
      this.state.participants.find((participant) => participant.id === participantId)?.name ||
      (message.role === "presenter" ? "Presenter" : "Guest");

    this.connections.set(connection.id, {
      participantId,
      name,
      role: message.role,
    });

    this.upsertParticipant({
      id: participantId,
      name,
      joinedAt:
        this.state.participants.find((participant) => participant.id === participantId)?.joinedAt ??
        Date.now(),
    });

    this.persistAndBroadcast();
  }

  handleSetName(connection: PartyConnection, participantId: string, name: string) {
    if (!participantId.trim() || !name.trim()) {
      this.send(connection, { type: "error", message: "Name is required." });
      return;
    }

    this.upsertParticipant({
      id: participantId.trim(),
      name: name.trim(),
      joinedAt:
        this.state.participants.find((participant) => participant.id === participantId.trim())?.joinedAt ??
        Date.now(),
    });

    const meta = this.connections.get(connection.id);
    if (meta) {
      meta.name = name.trim();
      this.connections.set(connection.id, meta);
    }

    this.persistAndBroadcast();
  }

  handleSlideSet(
    connection: PartyConnection,
    message: Extract<ClientMessage, { type: "slide_set" }>,
  ) {
    if (!this.assertPresenter(connection, message.presenterSecret)) {
      return;
    }

    const slide = allSlides.find((item) => item.id === message.slideId);
    if (!slide) {
      this.send(connection, { type: "error", message: "Unknown slide." });
      return;
    }

    this.state.displayMode = "slides";
    this.state.currentSlideId = slide.id;
    this.state.updatedAt = Date.now();

    if (slide.kind === "quiz" || slide.kind === "vote") {
      const currentQuestion = this.state.questions[slide.id] ?? createEmptyQuestionState(slide.id);
      if (currentQuestion) {
        this.state.questions[slide.id] = {
          ...currentQuestion,
          status: currentQuestion.status === "revealed" ? "revealed" : "open",
          updatedAt: Date.now(),
        };
      }
      this.state.activeQuestionSlideId = slide.id;
    } else {
      this.state.activeQuestionSlideId = null;
    }

    this.persistAndBroadcast();
    this.broadcast({
      type: "slide_changed",
      slideId: this.state.currentSlideId,
      activeQuestionSlideId: this.state.activeQuestionSlideId,
    });
  }

  handleVoteSubmit(
    connection: PartyConnection,
    message: Extract<ClientMessage, { type: "vote_submit" }>,
  ) {
    const activeSlideId = this.state.activeQuestionSlideId;
    if (!activeSlideId || activeSlideId !== message.slideId) {
      this.send(connection, { type: "error", message: "No active question to vote on." });
      return;
    }

    const question = this.state.questions[message.slideId] ?? createEmptyQuestionState(message.slideId);
    if (!question) {
      this.send(connection, { type: "error", message: "Unknown question." });
      return;
    }

    if (question.status === "revealed") {
      this.send(connection, { type: "error", message: "Voting is closed for this question." });
      return;
    }

    const nextVotes = {
      ...question.votes,
      [message.participantId]: message.optionId,
    };

    const nextQuestion = recomputeTotals(message.slideId, nextVotes);
    if (!nextQuestion) {
      this.send(connection, { type: "error", message: "Unable to compute results." });
      return;
    }

    this.state.questions[message.slideId] = {
      ...nextQuestion,
      status: "open",
    };
    this.state.updatedAt = Date.now();
    this.persistAndBroadcast();
  }

  handleQuestionReveal(
    connection: PartyConnection,
    message: Extract<ClientMessage, { type: "question_reveal" }>,
  ) {
    if (!this.assertPresenter(connection, message.presenterSecret)) {
      return;
    }

    const question = this.state.questions[message.slideId] ?? createEmptyQuestionState(message.slideId);
    if (!question) {
      this.send(connection, { type: "error", message: "Unknown question." });
      return;
    }

    this.state.questions[message.slideId] = {
      ...question,
      status: "revealed",
      updatedAt: Date.now(),
    };
    this.state.updatedAt = Date.now();
    this.persistAndBroadcast();
  }

  handleQuestionReset(
    connection: PartyConnection,
    message: Extract<ClientMessage, { type: "question_reset" }>,
  ) {
    if (!this.assertPresenter(connection, message.presenterSecret)) {
      return;
    }

    const emptyQuestion = createEmptyQuestionState(message.slideId);
    if (!emptyQuestion) {
      this.send(connection, { type: "error", message: "Unknown question." });
      return;
    }

    this.state.questions[message.slideId] = {
      ...emptyQuestion,
      status: this.state.activeQuestionSlideId === message.slideId ? "open" : "idle",
      updatedAt: Date.now(),
    };
    this.state.updatedAt = Date.now();
    this.persistAndBroadcast();
  }

  handleTimerStart(
    connection: PartyConnection,
    message: Extract<ClientMessage, { type: "timer_start" }>,
  ) {
    if (!this.assertPresenter(connection, message.presenterSecret)) {
      return;
    }

    this.state.facilitationTimer = {
      slideId: message.slideId,
      durationMs: Math.max(message.durationMs, 1000),
      startedAt: Date.now(),
      status: "running",
      updatedAt: Date.now(),
    };
    this.state.updatedAt = Date.now();
    this.persistAndBroadcast();
  }

  handleTimerReset(
    connection: PartyConnection,
    message: Extract<ClientMessage, { type: "timer_reset" }>,
  ) {
    if (!this.assertPresenter(connection, message.presenterSecret)) {
      return;
    }

    this.state.facilitationTimer = createIdleFacilitationTimerState();
    this.state.updatedAt = Date.now();
    this.persistAndBroadcast();
  }

  handleSessionReset(
    connection: PartyConnection,
    message: Extract<ClientMessage, { type: "session_reset" }>,
  ) {
    if (!this.assertPresenter(connection, message.presenterSecret)) {
      return;
    }

    this.state = createInitialState(
      this.room.id.replace(/^session-?/i, ""),
      this.state.presenterSecret,
    );
    this.persistAndBroadcast();
    this.broadcast({
      type: "slide_changed",
      slideId: this.state.currentSlideId,
      activeQuestionSlideId: this.state.activeQuestionSlideId,
    });
  }

  handleDisplayModeSet(
    connection: PartyConnection,
    message: Extract<ClientMessage, { type: "display_mode_set" }>,
  ) {
    if (!this.assertPresenter(connection, message.presenterSecret)) {
      return;
    }

    this.state.displayMode = message.mode;
    this.state.updatedAt = Date.now();
    this.persistAndBroadcast();
  }

  assertPresenter(connection: PartyConnection, presenterSecret: string) {
    const meta = this.connections.get(connection.id);
    if (!meta || meta.role !== "presenter") {
      this.send(connection, { type: "error", message: "Presenter privileges required." });
      return false;
    }

    if (!presenterSecret || presenterSecret !== this.state.presenterSecret) {
      this.send(connection, { type: "error", message: "Presenter secret mismatch." });
      return false;
    }

    return true;
  }

  upsertParticipant(participant: RealtimeParticipant) {
    const withoutExisting = this.state.participants.filter((item) => item.id !== participant.id);
    this.state.participants = [...withoutExisting, participant].sort((left, right) =>
      left.joinedAt - right.joinedAt,
    );
  }

  send(connection: PartyConnection, message: ServerMessage) {
    connection.send(JSON.stringify(message));
  }

  broadcast(message: ServerMessage) {
    this.room.broadcast(JSON.stringify(message));
  }

  async persistAndBroadcast() {
    await this.room.storage?.put("state", this.state);
    this.broadcast({
      type: "session_state",
      state: this.state,
    });
  }
}
