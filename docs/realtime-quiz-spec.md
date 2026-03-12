# Realtime Quiz Spec

## Goal

Add a realtime audience mode to the presentation so that:

- the presenter can start a live session
- attendees can scan a QR code and join on their phones
- attendees enter their name once
- phones follow the active slide automatically
- quiz questions accept live votes
- presenter sees live results and can reveal or reset a question

This system targets PartyKit as the realtime transport and ephemeral room state store.

## Architecture

- Next.js app on Vercel for presenter and audience UI
- PartyKit room per presentation session
- WebSocket connection from both presenter and audience clients into the same room
- PartyKit room is the source of truth for:
  - active slide id
  - participants
  - active quiz state
  - vote totals
  - reveal / lock status

## Session Model

Each live session maps to one PartyKit room named `session-<CODE>`.

Session code:

- 4 to 6 uppercase alphanumeric characters
- used in join URL and QR code
- example: `ABCD`

Presenter secret:

- generated locally when a presenter starts a session
- stored in presenter local storage
- never included in attendee join URLs
- required for privileged actions like changing slides or revealing answers

## Roles

### Presenter

Can:

- connect as presenter
- move slides
- open questions by moving onto quiz slides
- reveal answers
- reset question results

### Audience

Can:

- join by session code
- set name
- receive synced slide updates
- submit or change one vote per question until the question is revealed

## Client Identity

Each audience device gets a stable `participantId` in `localStorage`.

Participant record:

```ts
type Participant = {
  id: string;
  name: string;
  joinedAt: number;
};
```

Names are display-only. Vote identity uses `participantId`.

## Room State

```ts
type RealtimeQuestionState = {
  slideId: string;
  status: "idle" | "open" | "revealed";
  votes: Record<string, string>;
  totals: Record<string, number>;
  totalVotes: number;
  answerId: string;
  updatedAt: number;
};

type RealtimeSessionState = {
  sessionCode: string;
  currentSlideId: string;
  participants: Participant[];
  activeQuestionSlideId: string | null;
  questions: Record<string, RealtimeQuestionState>;
  updatedAt: number;
};
```

Notes:

- `votes` maps `participantId -> optionId`
- one vote per participant per slide
- moving to a quiz slide creates the question state if it does not yet exist
- moving to a non-quiz slide clears `activeQuestionSlideId`

## Event Contract

Messages are JSON over WebSocket.

Client to server:

```ts
type ClientMessage =
  | {
      type: "register";
      role: "presenter" | "audience";
      participantId: string;
      name?: string;
      presenterSecret?: string;
    }
  | {
      type: "set_name";
      participantId: string;
      name: string;
    }
  | {
      type: "slide_set";
      slideId: string;
      presenterSecret: string;
    }
  | {
      type: "vote_submit";
      slideId: string;
      optionId: string;
      participantId: string;
    }
  | {
      type: "question_reveal";
      slideId: string;
      presenterSecret: string;
    }
  | {
      type: "question_reset";
      slideId: string;
      presenterSecret: string;
    }
  | {
      type: "ping";
    };
```

Server to client:

```ts
type ServerMessage =
  | {
      type: "session_state";
      state: RealtimeSessionState;
    }
  | {
      type: "participants_updated";
      participants: Participant[];
    }
  | {
      type: "slide_changed";
      slideId: string;
      activeQuestionSlideId: string | null;
    }
  | {
      type: "question_state";
      question: RealtimeQuestionState;
    }
  | {
      type: "error";
      message: string;
    };
```

Implementation note:

- the room may choose to always broadcast `session_state` after every mutation
- dedicated event types still help client reducers remain explicit

## State Transitions

### Join

1. Client opens socket to the PartyKit room
2. Client sends `register`
3. Server stores or updates participant
4. Server replies with full `session_state`

### Presenter advances to a non-quiz slide

1. Presenter sends `slide_set`
2. Server verifies presenter secret
3. Server updates `currentSlideId`
4. Server clears `activeQuestionSlideId`
5. Server broadcasts updated state

### Presenter advances to a quiz slide

1. Presenter sends `slide_set`
2. Server verifies presenter secret
3. Server updates `currentSlideId`
4. Server initializes question state if missing
5. Server sets question status to `open` if not revealed
6. Server sets `activeQuestionSlideId` to that slide id
7. Server broadcasts updated state

### Audience votes

1. Audience sends `vote_submit`
2. Server checks the slide is the active question
3. Server ignores votes if question status is `revealed`
4. Server upserts `votes[participantId] = optionId`
5. Server recomputes totals
6. Server broadcasts updated question state

### Reveal

1. Presenter sends `question_reveal`
2. Server verifies presenter secret
3. Server marks question as `revealed`
4. Server broadcasts updated question state

### Reset

1. Presenter sends `question_reset`
2. Server verifies presenter secret
3. Server clears votes and totals for that slide
4. Server sets status back to `open` if that slide is active, else `idle`
5. Server broadcasts updated question state

## UI Surfaces

### Presenter Deck

The existing deck remains the presenter surface and gains:

- live session panel
- start session button
- join URL
- QR code
- participant count
- live results for current quiz slide
- reveal and reset controls for current quiz slide

Presenter is still allowed to navigate locally with keyboard and deck buttons.
When a live session is connected, slide changes also broadcast to PartyKit.

### Audience Join Page

Path: `/join/[code]`

States:

- enter name
- connecting
- waiting for presenter
- non-quiz slide active
- quiz active
- revealed results

The audience page is mobile-first and does not render the full slide deck. It renders only the currently relevant prompt and voting UI.

## Environment

Required public env vars:

- `NEXT_PUBLIC_PARTYKIT_HOST`
  - PartyKit host, example `your-app.your-name.partykit.dev`
- `NEXT_PUBLIC_PARTYKIT_ROOM_PREFIX`
  - optional, defaults to `session`

Optional:

- `NEXT_PUBLIC_APP_URL`
  - used to render absolute join URLs in the presenter UI

## Security

This is intentionally lightweight for internal use.

Protections:

- only presenter actions require `presenterSecret`
- presenter secret never appears in QR or attendee URL
- attendee votes are keyed by stable `participantId`

Non-goals for v1:

- hardened auth
- per-user permissions
- replay protection across devices

## Implementation Plan

1. Add shared realtime types and helpers
2. Add PartyKit room server
3. Add presenter live session controls and socket sync
4. Add audience join page
5. Add QR code panel
6. Verify build and lint
