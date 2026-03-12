import type { Slide } from "@/components/presentation/types";

export const slides: Slide[] = [
  {
    id: "opening",
    kind: "hero",
    theme: "lime",
    eyebrow: "Slice Mobile / Internal Hackathon",
    title: "Slice AI Hackathon",
    subtitle: "Learn fast. Build boldly. Demo something real.",
    supportingLine:
      "Two days to explore how AI can help every team move faster.",
    meta: "2-day internal hackathon",
    speakerNotes:
      "Open with energy. Set the tone: this is practical, collaborative, and a chance to test ideas quickly rather than chase perfection.",
  },
  {
    id: "why",
    kind: "statement",
    theme: "ink",
    eyebrow: "Why we are doing this",
    title: "This is about learning how to work with AI well.",
    body: "Shipping something cool matters. Learning how AI changes thinking, planning, and execution matters more. We want people across Slice to leave with stronger instincts, sharper language, and a clearer sense of where AI is actually useful.",
    bullets: [
      "AI is useful across technical and non-technical work.",
      "The goal is better collaboration, not blind automation.",
      "Real workflows matter more than impressive jargon.",
    ],
    callout: "Good teams will learn a repeatable way of working, not just a one-off trick.",
    sideLabel: "Learning > theatre",
    speakerNotes:
      "Stress that the event is for everyone. Make it safe for non-engineers to participate without pretending to code.",
  },
  {
    id: "success",
    kind: "list",
    theme: "lime",
    eyebrow: "What success looks like",
    title: "More than code. More than polish.",
    intro:
      "The strongest projects will show clear thinking, smart tool use, and a demo that teaches us something useful.",
    items: [
      {
        title: "Clear problem definition",
        description: "A specific pain point, opportunity, or question worth solving.",
      },
      {
        title: "Useful prototype or workflow",
        description: "Something tangible that moves an idea into a testable form.",
      },
      {
        title: "Critical thinking",
        description: "Teams should challenge AI output, not just accept it.",
      },
      {
        title: "Mixed-team collaboration",
        description: "Strong projects connect domain knowledge with practical implementation.",
      },
      {
        title: "Sharp demo",
        description: "Explain what you built, why it matters, and what you learned.",
      },
    ],
    footer: "If the demo is clear and the learning is real, you are on the right track.",
  },
  {
    id: "challenge",
    kind: "list",
    theme: "blue",
    eyebrow: "The challenge",
    title: "Find a real idea. Scope it hard. Build enough to show it.",
    intro:
      "Every team should identify one worthwhile idea, use AI to move faster, and end with a five-minute demo that makes the value obvious.",
    items: [
      {
        title: "Start with a pain point or experiment",
        description: "Choose something practical, playful, or surprising, as long as the idea is clear.",
      },
      {
        title: "Use AI to accelerate the path",
        description: "Let AI help with research, planning, code, copy, and iteration.",
      },
      {
        title: "Use internal data if it helps",
        description: "Useful, but not mandatory. A strong mock workflow is still valid.",
      },
      {
        title: "Keep scope tight",
        description: "Aim for a focused prototype that can be understood in minutes.",
      },
    ],
    footer: "The right question is not 'can we build everything?' It is 'what can we prove quickly?'",
  },
  {
    id: "internal-data",
    kind: "statement",
    theme: "pink",
    eyebrow: "Internal data encouraged",
    title: "Useful plus memorable usually wins.",
    body: "Using our own data, workflows, reporting pain, support pain, or internal tools is strongly encouraged because it gives the work real texture. But it is not a hard requirement. Fun, weird, exploratory ideas are absolutely welcome if they still have a point behind them.",
    bullets: [
      "Internal workflows give projects grounding.",
      "Experimental ideas can still reveal valuable patterns.",
      "The sweet spot is useful, memorable, and well explained.",
    ],
    callout: "Do not force internal data into a weak idea. Use it when it makes the concept stronger.",
    sideLabel: "Useful + memorable",
  },
  {
    id: "teams",
    kind: "list",
    theme: "lime",
    eyebrow: "How teams should work",
    title: "Mixed teams. Shared ownership. Constant translation.",
    intro:
      "The best teams will treat AI work as a live conversation between domain experts, builders, and reviewers.",
    items: [
      {
        title: "Non-technical teammates define the problem",
        description: "Bring users, workflow pain, edge cases, and business context into the room.",
      },
      {
        title: "Technical teammates scope the build",
        description: "Turn the idea into a realistic implementation path with clear tradeoffs.",
      },
      {
        title: "Everyone prompts, reviews, and tests",
        description: "AI is a team tool, not just an engineer tool.",
      },
      {
        title: "Narrate the jargon",
        description: "Technical people should explain concepts as they work so the whole team levels up.",
      },
    ],
    footer: "If one person disappears into a laptop for two days, the team is leaving value on the table.",
  },
  {
    id: "workflow",
    kind: "workflow",
    theme: "ink",
    eyebrow: "A practical AI workflow",
    title: "Brief. Spec. Build. Critique. Demo.",
    intro:
      "This is a simple loop worth reusing after the hackathon. It keeps teams clear, fast, and honest.",
    steps: [
      {
        name: "Brief",
        description: "Clarify the problem, the user, and what good looks like.",
        aiHelpsWith: "Turn vague ideas into a sharper problem statement and useful questions.",
      },
      {
        name: "Spec",
        description: "Convert the idea into tasks, flows, constraints, and success criteria.",
        aiHelpsWith: "Draft requirements, edge cases, acceptance criteria, and build plans.",
      },
      {
        name: "Build",
        description: "Create the prototype, content, logic, and supporting assets.",
        aiHelpsWith: "Generate code, copy, structure, stubs, and alternative implementation paths.",
      },
      {
        name: "Critique",
        description: "Pressure-test assumptions, find gaps, and tighten the solution.",
        aiHelpsWith: "Act as a reviewer, QA partner, or skeptical stakeholder.",
      },
      {
        name: "Demo",
        description: "Tell the story of the problem, the workflow, and the outcome.",
        aiHelpsWith: "Shape a concise narrative, slide copy, and talking points.",
      },
    ],
    speakerNotes:
      "This is the most reusable teaching slide. Slow down slightly and give one concrete example of each stage.",
  },
  {
    id: "where-ai-helps",
    kind: "function-grid",
    theme: "lime",
    eyebrow: "Where AI helps most",
    title: "Not one team. Not one job.",
    intro:
      "AI is especially good at accelerating first drafts, pattern finding, structure, and repetitive thinking across many functions.",
    items: [
      {
        functionName: "Engineering",
        examples: ["Scaffold internal tools", "Generate tests", "Write migration plans"],
      },
      {
        functionName: "Product",
        examples: ["Shape briefs", "Map user flows", "Pressure-test requirements"],
      },
      {
        functionName: "Customer Support",
        examples: ["Draft macros", "Summarize ticket themes", "Suggest workflow fixes"],
      },
      {
        functionName: "Marketing",
        examples: ["Generate campaign drafts", "Create briefing structure", "Test message angles"],
      },
      {
        functionName: "Operations",
        examples: ["Map process gaps", "Summarize recurring issues", "Design handoff checklists"],
      },
      {
        functionName: "Finance and Reporting",
        examples: ["Explain metrics", "Draft reporting commentary", "Spot anomalies to inspect"],
      },
      {
        functionName: "People and Internal Docs",
        examples: ["Improve onboarding", "Rewrite policy drafts", "Create knowledge summaries"],
      },
    ],
  },
  {
    id: "human-judgment",
    kind: "list",
    theme: "blue",
    eyebrow: "Where humans still matter",
    title: "Judgment is not optional.",
    intro:
      "This event is about using AI well, not outsourcing thinking. Human review is where the real quality bar lives.",
    items: [
      {
        title: "Judgment and prioritization",
        description: "Decide what matters, what does not, and where the real risk is.",
      },
      {
        title: "Taste and communication",
        description: "Make the output clear, appropriate, and worth showing to others.",
      },
      {
        title: "Context",
        description: "Bring in business nuance, internal constraints, and real-world knowledge.",
      },
      {
        title: "Ethics and sensitivity",
        description: "Handle ambiguous, private, or consequential decisions carefully.",
      },
      {
        title: "Validation",
        description: "Check whether the answer is correct, useful, and safe enough to trust.",
      },
    ],
    footer: "If AI gives you a fast answer, your job is still to decide whether it deserves to survive.",
  },
  {
    id: "tooling",
    kind: "list",
    theme: "ink",
    eyebrow: "Tooling",
    title: "Use the right AI tool for the job.",
    intro:
      "Antigravity matters here, especially for building and implementation, but it should sit inside a wider toolset rather than becoming the whole story.",
    items: [
      {
        title: "Antigravity",
        description: "Great for building, implementation flow, and turning scoped ideas into working prototypes.",
      },
      {
        title: "Chat and reasoning models",
        description: "Useful for idea shaping, spec writing, critique, and tightening messy thoughts.",
      },
      {
        title: "AI across the stack",
        description: "Use it for code, copy, testing, structure, documentation, and presentation polish.",
      },
      {
        title: "Mix tools deliberately",
        description: "Different models and interfaces are better at different jobs. That is normal.",
      },
    ],
    footer: "Practical teams switch tools when the workflow demands it.",
  },
  {
    id: "jargon-intro",
    kind: "statement",
    theme: "pink",
    eyebrow: "Quiz time",
    title: "AI Terms, Minus the Nonsense",
    body: "A quick jargon-busting round before the build starts. The point is not to sound technical. The point is to leave knowing what these words actually mean in plain English.",
    bullets: [
      "One focused question per slide.",
      "Pick an answer, then reveal.",
      "Keep score if you want. No shame if you miss a few.",
    ],
    callout: "If a term cannot be explained simply, it is probably being used badly.",
    sideLabel: "Jargon busting",
  },
  {
    id: "quiz-prompt",
    kind: "quiz",
    theme: "lime",
    eyebrow: "Jargon busting 1/5",
    title: "What is a prompt?",
    format: "plain-english",
    prompt: "Pick the best plain-English definition.",
    options: [
      {
        id: "a",
        label: "A",
        text: "A set of instructions or context you give an AI system so it knows what to do.",
      },
      {
        id: "b",
        label: "B",
        text: "A model update that permanently changes how the AI behaves for everyone.",
      },
      {
        id: "c",
        label: "C",
        text: "A dashboard for monitoring token spend across a company.",
      },
    ],
    answerId: "a",
    explanation:
      "A prompt is just the input: instructions, examples, context, constraints, or questions. Better prompts usually produce better output.",
  },
  {
    id: "quiz-hallucination",
    kind: "quiz",
    theme: "blue",
    eyebrow: "Jargon busting 2/5",
    title: "Hallucination means...",
    format: "multiple-choice",
    prompt: "Choose the most accurate answer.",
    options: [
      {
        id: "a",
        label: "A",
        text: "The AI takes too long to respond because it is searching large databases.",
      },
      {
        id: "b",
        label: "B",
        text: "The AI confidently produces something false, made up, or unsupported.",
      },
      {
        id: "c",
        label: "C",
        text: "The AI refuses to answer because the prompt is too short.",
      },
    ],
    answerId: "b",
    explanation:
      "Hallucination is not just a weird answer. It is a wrong or fabricated answer presented as if it were reliable.",
  },
  {
    id: "quiz-agent",
    kind: "quiz",
    theme: "pink",
    eyebrow: "Jargon busting 3/5",
    title: "Real term or fake: context window",
    format: "real-or-fake",
    prompt: "What does this term actually refer to?",
    options: [
      {
        id: "a",
        label: "A",
        text: "A real term for how much text or information the model can consider at one time.",
      },
      {
        id: "b",
        label: "B",
        text: "A fake marketing phrase for AI-powered browser tabs.",
      },
      {
        id: "c",
        label: "C",
        text: "A real term for a special UI that only agents can access.",
      },
    ],
    answerId: "a",
    explanation:
      "The context window is the amount of information a model can work with in one go. If important detail falls outside it, quality can drop.",
  },
  {
    id: "quiz-rag",
    kind: "quiz",
    theme: "ink",
    eyebrow: "Jargon busting 4/5",
    title: "RAG is best explained as...",
    format: "plain-english",
    prompt: "Pick the answer you would use with a non-technical teammate.",
    options: [
      {
        id: "a",
        label: "A",
        text: "A way of letting AI pull in relevant documents or facts before answering, so responses are more grounded.",
      },
      {
        id: "b",
        label: "B",
        text: "A method for compressing large language models into smaller edge devices.",
      },
      {
        id: "c",
        label: "C",
        text: "A ranking system that scores how creative an answer feels.",
      },
    ],
    answerId: "a",
    explanation:
      "RAG stands for retrieval-augmented generation. In practice, it means the model looks up relevant material first instead of relying only on memory.",
  },
  {
    id: "quiz-evals",
    kind: "quiz",
    theme: "lime",
    eyebrow: "Jargon busting 5/5",
    title: "What are evals?",
    format: "multiple-choice",
    prompt: "Choose the best practical definition.",
    options: [
      {
        id: "a",
        label: "A",
        text: "A structured way to test whether an AI system performs well on the tasks you care about.",
      },
      {
        id: "b",
        label: "B",
        text: "A legal review process required before any AI tool can ship.",
      },
      {
        id: "c",
        label: "C",
        text: "An internal leaderboard that compares different prompt writers.",
      },
    ],
    answerId: "a",
    explanation:
      "Evals are how you measure quality. They turn 'this feels good' into repeatable checks against real tasks or expected outputs.",
  },
  {
    id: "rules",
    kind: "list",
    theme: "blue",
    eyebrow: "Rules of the hackathon",
    title: "Move fast. Stay sharp.",
    intro:
      "These rules are here to protect quality, clarity, and good habits while the pace is high.",
    items: [
      {
        title: "Keep scope tight",
        description: "A focused prototype beats a sprawling unfinished concept.",
      },
      {
        title: "Define success before building",
        description: "Know what you are proving before AI helps you produce a lot of output.",
      },
      {
        title: "Use AI to accelerate, not to hide weak thinking",
        description: "Fast output is not the same thing as a strong idea.",
      },
      {
        title: "Review outputs critically",
        description: "Check facts, logic, usefulness, and clarity before anything goes into a demo.",
      },
      {
        title: "Respect privacy and data boundaries",
        description: "Be careful with sensitive information and internal constraints.",
      },
      {
        title: "Show something tangible",
        description: "Every final demo should make the work concrete.",
      },
    ],
  },
  {
    id: "judging",
    kind: "list",
    theme: "lime",
    eyebrow: "Judging criteria",
    title: "What the room should notice.",
    intro:
      "Judging is not about perfection. It is about whether the team picked a worthwhile problem and used AI intelligently.",
    items: [
      {
        title: "Clarity of problem",
        description: "Is the challenge obvious and well framed?",
      },
      {
        title: "Creativity",
        description: "Did the team find an interesting angle or fresh approach?",
      },
      {
        title: "Usefulness",
        description: "Would this help someone, save time, or reveal something valuable?",
      },
      {
        title: "Quality of execution",
        description: "Does the prototype feel coherent, intentional, and demo-ready?",
      },
      {
        title: "Smart use of AI",
        description: "Was AI used deliberately and effectively, not just visibly?",
      },
      {
        title: "Collaboration and storytelling",
        description: "Did the team explain the journey clearly and show shared ownership?",
      },
      {
        title: "Learning value",
        description: "Did the work teach us something reusable?",
      },
    ],
  },
  {
    id: "agenda",
    kind: "timeline",
    theme: "ink",
    eyebrow: "Agenda",
    title: "Two days. One clear arc.",
    intro:
      "Keep the rhythm simple: align early, build with purpose, then tighten the story before demos.",
    days: [
      {
        label: "Day 1",
        theme: "blue",
        items: [
          "Kickoff and challenge framing",
          "Team formation and idea shaping",
          "Scoping the first version",
          "Early build and workflow setup",
          "Checkpoint and direction reset",
        ],
      },
      {
        label: "Day 2",
        theme: "pink",
        items: [
          "Continue build with tighter focus",
          "Testing, critique, and iteration",
          "Demo prep and narrative polishing",
          "Final presentations",
          "Wrap-up and shared learning",
        ],
      },
    ],
  },
  {
    id: "idea-prompts",
    kind: "prompts",
    theme: "pink",
    eyebrow: "Project idea prompts",
    title: "Useful, weird, or both.",
    intro:
      "Use these as sparks, not boxes. Good teams adapt them to real Slice context or twist them into something memorable.",
    prompts: [
      "A support workflow assistant that drafts replies or surfaces repeat issues.",
      "An internal reporting helper that turns raw numbers into plain-English summaries.",
      "A campaign briefing generator for faster creative kickoffs.",
      "A product QA helper that turns requirements into test cases and edge cases.",
      "An onboarding or HR helper that reduces repetitive internal questions.",
      "A knowledge lookup tool that grounds answers in trusted internal docs.",
      "Something delightfully odd that still teaches us a useful lesson.",
    ],
  },
  {
    id: "demo-expectations",
    kind: "list",
    theme: "lime",
    eyebrow: "Demo expectations",
    title: "Five minutes. Make it count.",
    intro:
      "The strongest demos are simple, concrete, and honest about what AI did well versus what humans still had to decide.",
    items: [
      {
        title: "What problem did you pick?",
        description: "Explain the need clearly and quickly.",
      },
      {
        title: "Why does it matter?",
        description: "Make the value legible to people outside your function.",
      },
      {
        title: "How did AI help?",
        description: "Show where it accelerated the process or improved the workflow.",
      },
      {
        title: "What did humans still need to do?",
        description: "Call out the judgment, review, and decisions the team owned.",
      },
      {
        title: "What did you build?",
        description: "Show the prototype, flow, or working artifact.",
      },
      {
        title: "What would you do next?",
        description: "End with the next sensible step, not a giant wish list.",
      },
    ],
  },
  {
    id: "closing",
    kind: "closing",
    theme: "ink",
    eyebrow: "Go build",
    title: "Make it useful, weird, or both.",
    lines: [
      "Learn the tools.",
      "Question the output.",
      "Build something worth showing.",
    ],
    kicker: "Two days. Real collaboration. One demo that teaches the room something new.",
    speakerNotes:
      "Finish briskly. Send people into team formation with energy and a simple quality bar.",
  },
];
