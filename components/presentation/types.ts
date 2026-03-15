export type SlideTheme = "lime" | "ink" | "blue" | "pink";

export type DeckId = "day1-kickoff" | "day2-demos";

export type BaseSlide = {
  id: string;
  title: string;
  eyebrow?: string;
  presenterCue?: string;
  speakerNotes?: string;
  theme?: SlideTheme;
};

export type HeroSlide = BaseSlide & {
  kind: "hero";
  subtitle: string;
  supportingLine: string;
  meta: string;
};

export type StatementSlide = BaseSlide & {
  kind: "statement";
  body: string;
  callout?: string;
  bullets?: string[];
  sideLabel?: string;
};

export type ListSlide = BaseSlide & {
  kind: "list";
  intro: string;
  items: string[];
  footer?: string;
};

export type FunctionGridSlide = BaseSlide & {
  kind: "function-grid";
  intro: string;
  functions: Array<{
    team: string;
    examples: string[];
  }>;
};

export type TimelineSlide = BaseSlide & {
  kind: "timeline";
  intro: string;
  phases: string[];
};

export type PromptSlide = BaseSlide & {
  kind: "prompts";
  intro: string;
  prompts: string[];
  footer?: string;
  timerLabel?: string;
  timerMinutes?: number;
};

export type ClosingSlide = BaseSlide & {
  kind: "closing";
  lines: string[];
  kicker: string;
};

export type QuizOption = {
  id: string;
  label: string;
};

export type QuizSlide = BaseSlide & {
  kind: "quiz";
  format: "multiple-choice" | "plain-english" | "real-or-fake";
  prompt: string;
  answers: QuizOption[];
  correctAnswer: string;
  correctConcept: string;
  explanation: string;
};

export type VotingSlide = BaseSlide & {
  kind: "vote";
  intro: string;
  items: string[];
  footer?: string;
  voting: {
    status: "coming-soon";
    prompt: string;
  };
};

export type Slide =
  | HeroSlide
  | StatementSlide
  | ListSlide
  | FunctionGridSlide
  | TimelineSlide
  | PromptSlide
  | ClosingSlide
  | QuizSlide
  | VotingSlide;

export type Deck = {
  id: DeckId;
  title: string;
  slides: Slide[];
};

export type SlideDeckData = {
  deckVersion: number;
  decks: Deck[];
};

export type SlideRef = {
  deckId: DeckId;
  slideId: string;
};

export type QuizProgress = Record<
  string,
  {
    selectedId: string | null;
    revealed: boolean;
  }
>;
