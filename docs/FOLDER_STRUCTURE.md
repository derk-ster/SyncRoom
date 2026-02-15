# SyncRoom — Folder Structure

```
SyncRoom/
├── client/                          # Frontend (React + Vite)
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/                  # Static assets (images, etc.)
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ui/                  # Buttons, inputs, cards
│   │   │   ├── room/                # Room-specific (video area, controls)
│   │   │   └── effects/             # Particles, glow, mouse light
│   │   ├── hooks/                   # Custom React hooks (useSocket, useSync)
│   │   ├── pages/                   # Route-level pages
│   │   │   ├── Landing.tsx
│   │   │   └── Room.tsx
│   │   ├── store/                   # Zustand stores
│   │   ├── lib/                     # Utilities, socket client, constants
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                          # Backend (Node.js + Express + Socket.io)
│   ├── src/
│   │   ├── index.ts                 # Express + Socket.io entry
│   │   ├── socket/                  # Socket.io handlers
│   │   │   ├── handlers.ts          # join, leave, play, pause, seek
│   │   │   └── rooms.ts            # In-memory room state (host, guests)
│   │   ├── sync/                    # Sync logic
│   │   │   └── driftCorrection.ts  # Periodic drift correction
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
│
├── phase1-static/                   # Phase 1: Static HTML/CSS (reference)
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── FOLDER_STRUCTURE.md
│   ├── DEPLOYMENT.md
│   └── PHASES.md
│
├── .env.example                    # Example env vars (client + server)
├── .gitignore
└── README.md
```

## Notes

- **client/** is the main frontend; **phase1-static/** is the initial static prototype kept for reference.
- **server/** is the main backend; all real-time and room logic lives here.
- **docs/** holds architecture, folder structure, deployment, and phase-by-phase notes.
