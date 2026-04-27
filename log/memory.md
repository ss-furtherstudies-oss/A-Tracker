# A-Tracker Project Memory

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL)
- **Icons**: `lucide-react`
- **Excel Parsing**: `xlsx-js-style` / `xlsx`

## Architecture
- **State Management**: Context API (`StudentContext`, `AuthContext`, `QSContext`). Avoid heavy prop-drilling.
- **Data Models**: 
  - `students`: Core profiles and application statuses.
  - `applications`: U-App workflow (destinations and offers).
  - `academicData`: Stored in JSON structures containing arrays for `igcse`, `ias`, `ial`, `ielts`.
- **Modals**: Centralized actions (e.g., `StudentApplicationsEditModal.jsx`, `StudentEditModal.jsx`) triggered from the main `StudentsGrid`.

## Core Rules
- **UI/UX**: Prioritize modern aesthetics—vibrant gradients (`aura-teal`, `serene-indigo`), glassmorphism, micro-animations, and clean empty states.
- **Robustness**: Always validate external data imports (e.g., sanitize Excel `dob` fields via `getSafeDate` before `toISOString()`).
- **Memory Management**: Read/write context to `log/memory.md` and `log/session_log.md` via specific user commands.
