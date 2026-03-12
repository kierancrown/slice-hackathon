# Slice AI Presentation

Interactive presentation deck for the Slice AI hackathon, with an optional realtime quiz mode powered by PartyKit.

## App

- presenter deck: `/`
- audience join page: `/join/[code]`
- PartyKit room server: `partykit/session.ts`
- realtime spec: `docs/realtime-quiz-spec.md`

## Local development

Install dependencies:

```bash
npm install
```

Run the Next.js app:

```bash
npm run dev
```

Run the PartyKit room server locally in a second terminal:

```bash
npm run partykit:dev
```

## Realtime setup

The realtime quiz flow expects a PartyKit deployment and these public env vars in the Next.js app:

```bash
NEXT_PUBLIC_PARTYKIT_HOST=your-app.your-name.partykit.dev
NEXT_PUBLIC_PARTYKIT_ROOM_PREFIX=session
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:

- `NEXT_PUBLIC_PARTYKIT_HOST` is required for presenter and audience sockets
- `NEXT_PUBLIC_PARTYKIT_ROOM_PREFIX` is optional and defaults to `session`
- `NEXT_PUBLIC_APP_URL` is used to generate the QR join URL in the presenter panel

## PartyKit

The repo includes:

- `partykit.json`
- `partykit/session.ts`

Local commands:

```bash
npm run partykit:dev
npm run partykit:deploy
npm run partykit:tail
```

Deploy flow:

1. Create a PartyKit account and log in with the CLI.
2. Deploy the room server:

```bash
npm run partykit:deploy
```

3. Note the deployed PartyKit host.
4. Set `NEXT_PUBLIC_PARTYKIT_HOST` in Vercel to that host.
5. Set `NEXT_PUBLIC_APP_URL` in Vercel to your frontend URL.
6. Redeploy the frontend.

Deploy that service with PartyKit so the Vercel-hosted frontend can connect to it over WebSocket.

## Vercel env vars

Set these in the Vercel project:

```bash
NEXT_PUBLIC_PARTYKIT_HOST=your-app.your-name.partykit.dev
NEXT_PUBLIC_PARTYKIT_ROOM_PREFIX=session
NEXT_PUBLIC_APP_URL=https://your-frontend.vercel.app
```

## Presenter flow

1. Open the deck on `/`
2. Click `Start` in the live session panel
3. Scan the QR code or open the join URL on a phone
4. Advance through slides as normal
5. When the active slide is a quiz slide, phones receive the question automatically
6. Reveal or reset the current question from the live session panel

## Shipping checklist

1. Create the PartyKit account.
2. Run `npm run partykit:deploy`.
3. Set the Vercel public env vars from `.env.example`.
4. Deploy the frontend to Vercel.
5. Open the presenter deck and confirm the live panel shows `Connected`.
6. Join from a phone and verify slide sync, voting, reveal, and reset.

## Verification

```bash
npm run build
npm run lint
```
