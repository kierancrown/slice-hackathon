export type SlideTheme = "lime" | "ink" | "blue" | "pink";

export type BaseSlide = {
  id: string;
  title: string;
  eyebrow?: string;
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
  items: Array<{
    title: string;
    description: string;
  }>;
  footer?: string;
};

export type WorkflowSlide = BaseSlide & {
  kind: "workflow";
  intro: string;
  steps: Array<{
    name: string;
    description: string;
    aiHelpsWith: string;
  }>;
};

export type FunctionGridSlide = BaseSlide & {
  kind: "function-grid";
  intro: string;
  items: Array<{
    functionName: string;
    examples: string[];
  }>;
};

export type TimelineSlide = BaseSlide & {
  kind: "timeline";
  intro: string;
  days: Array<{
    label: string;
    theme: "ink" | "blue" | "pink";
    items: string[];
  }>;
};

export type PromptSlide = BaseSlide & {
  kind: "prompts";
  intro: string;
  prompts: string[];
};

export type ClosingSlide = BaseSlide & {
  kind: "closing";
  lines: string[];
  kicker: string;
};

export type QuizOption = {
  id: string;
  label: string;
  text: string;
};

export type QuizSlide = BaseSlide & {
  kind: "quiz";
  format: "multiple-choice" | "plain-english" | "real-or-fake";
  prompt: string;
  options: QuizOption[];
  answerId: string;
  explanation: string;
};

export type Slide =
  | HeroSlide
  | StatementSlide
  | ListSlide
  | WorkflowSlide
  | FunctionGridSlide
  | TimelineSlide
  | PromptSlide
  | ClosingSlide
  | QuizSlide;

export type QuizProgress = Record<
  string,
  {
    selectedId: string | null;
    revealed: boolean;
  }
>;
