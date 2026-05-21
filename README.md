# Antenati — Online Reservation System

A production-ready table reservation module built with **Next.js 16**, **React 19**, and **TypeScript**. Designed to be embedded as a standalone section inside a restaurant website, it handles the full booking flow from form input to post-submission confirmation.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Business Rules](#business-rules)
- [Data Model](#data-model)
- [Backend Integration](#backend-integration)
- [Anti-Spam Protection](#anti-spam-protection)
- [Reservation Flow](#reservation-flow)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)

---

## Overview

The app provides a single-page reservation experience accessible at `/reservation`. The root route (`/`) redirects there automatically.

Users fill in a form, the frontend validates input and applies business rules, then builds and sends a structured JSON payload to a REST backend. After submission, a confirmation screen explains that the reservation is pending until the restaurant confirms it via WhatsApp, Telegram, or Email.

---

## Tech Stack

| Layer       | Technology                                         |
|-------------|---------------------------------------------------|
| Framework   | Next.js 16 (App Router)                           |
| UI Library  | React 19                                          |
| Language    | TypeScript 5                                      |
| Styling     | Bootstrap 5.3 + custom SCSS (Sass)                |
| Animation   | Framer Motion 12                                  |
| Phone input | react-phone-input-2                               |
| Linting     | ESLint 9 + eslint-config-next                     |
| Dev tooling | open-cli (auto-opens browser on `npm run dev`)    |

---

## Project Structure

```
antenati/
├── app/
│   ├── layout.tsx              # Root layout — imports Bootstrap, phone CSS, globals
│   ├── page.tsx                # Root route — redirects to /reservation
│   ├── globals.css             # Custom CSS (card, hero, phone input, success screen)
│   └── reservation/
│       └── page.tsx            # /reservation page with Framer Motion hero section
├── components/
│   └── ReservationForm.tsx     # Main form component (all state and validation logic)
├── services/
│   └── reservationService.ts  # API calls + fallback data for locations and options
├── types/
│   └── reservation.ts          # TypeScript interfaces: Prenotazione, ReservationRequest, Location, Option
└── public/
    └── images/                 # Static assets (hero background, etc.)
```

---

## Features

### Form Fields

| Field          | Required | Notes                                              |
|----------------|----------|----------------------------------------------------|
| Nome           | Yes      | Letters only (including accented characters)       |
| Cognome        | No       | Letters only (including accented characters)       |
| Posizione      | Yes      | `Dentro` (inside) or `Fuori` (outside)             |
| N. Coperti     | Yes      | 1–9 guests; > 9 shows a direct-contact warning     |
| Data           | Yes      | From today up to 31 December of the current year   |
| Orario         | Yes      | Dynamically loaded from the backend by day of week |
| Email          | Partial  | Required if phone is not provided                  |
| Telefono       | Partial  | Required if email is not provided                  |
| Note           | No       | Free text (allergies, birthdays, etc.)             |
| Seggiolino     | No       | Children's high chair — available for all positions|
| Stufa esterna  | No       | Outdoor heater — **only shown when `Fuori`**       |

### UX Details

- **Animated hero section** with scroll-driven parallax (Framer Motion `useScroll` + `useTransform`).
- **International phone input**: flag selector (react-phone-input-2) with a separate digit field. The dial code is prepended internally (e.g. `393123456789` for Italy).
- **Dynamic time slots**: selecting a date triggers a fetch to the backend (`GET /drop-down/hours/:day`). The slot dropdown is disabled until a date is chosen.
- **Conditional option**: the `Stufa esterna` select is rendered only when position is `Fuori`; switching back to `Dentro` automatically resets the value to `false`.
- **Success screen**: replaces the form after submission with next-steps guidance (WhatsApp / Telegram / Email channels). A "Nuova Prenotazione" button resets the entire state.

---

## Business Rules

All rules are enforced on the frontend in `ReservationForm.tsx` before the API call.

| Rule                                              | Behaviour                                                       |
|---------------------------------------------------|-----------------------------------------------------------------|
| Name is mandatory                                 | Blocks submission with inline error                            |
| Date and time are mandatory                       | Blocks submission with inline error                            |
| At least one contact method                       | Email **or** phone must be provided                            |
| Email format                                      | Validated against `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`               |
| Phone length                                      | Digit-only part must be ≥ 9 characters                         |
| Guest count 1–9                                   | Values > 9 show a warning box and block submission             |
| Date range                                        | Min = today; Max = 31 December of the current year             |
| Time slots are day-aware                          | Backend filters slots per day of week (e.g. Fri/Sat/Sun → only 20:00 & 21:30) |
| Past time slots                                   | Backend returns only future-valid slots                        |
| Backend capacity                                  | Backend can reject a date if fully booked and return next available date |
| Stufa only outdoors                               | `stufa` resets to `false` when position changes to `Dentro`    |

---

## Data Model

### Frontend model — `Prenotazione`

```ts
interface Prenotazione {
  nome: string
  cognome?: string
  posizione: 'dentro' | 'fuori'
  numeroPosti: number
  data: string          // ISO date: "YYYY-MM-DD"
  orario: string        // e.g. "20:00"
  note?: string
  email?: string
  telefono?: string     // dialCode + digits, e.g. "393123456789"
  opzioni: {
    seggiolino: boolean
    stufa: boolean
  }
}
```

### Backend model — `ReservationRequest`

```ts
interface ReservationRequest {
  name: string
  surname?: string | null
  location: number        // Location ID resolved from API/fallback
  cover: number
  reserved_at: string     // ISO date: "YYYY-MM-DD"
  time: string            // e.g. "20:00"
  note?: string | null
  email?: string | null
  phone?: string | null   // includes dial code
  options: number[]       // array of Option IDs
}
```

### Mapping logic (`reservationService.ts`)

| Frontend field        | Backend field   | Transform                                                      |
|-----------------------|-----------------|----------------------------------------------------------------|
| `posizione`           | `location`      | Name-matched against `/drop-down/locations` → returns ID       |
| `opzioni.seggiolino`  | `options[]`     | Name-matched against `/drop-down/options` → pushes ID if true  |
| `opzioni.stufa`       | `options[]`     | Name-matched against `/drop-down/options` → pushes ID if true  |
| `nome` / `cognome`    | `name`/`surname`| `.trim()` applied; empty cognome becomes `null`                |
| `email`               | `email`         | `.trim().toLowerCase()`; empty becomes `null`                  |
| `note`                | `note`          | `.trim()`; empty becomes `null`                                |

---

## Backend Integration

Base URL is read from `NEXT_PUBLIC_API_BASE_URL` (see [Environment Variables](#environment-variables)).

### Endpoints

| Method | Path                        | Description                                                       |
|--------|-----------------------------|-------------------------------------------------------------------|
| POST   | `/reservation`              | Creates a new reservation with the mapped payload                 |
| GET    | `/drop-down/locations`      | Returns `{ id, name }[]` for seating areas (dentro / fuori)      |
| GET    | `/drop-down/options`        | Returns `{ id, name }[]` for extra services (seggiolino / stufa)  |
| GET    | `/drop-down/hours/:day`     | Returns `{ hours: string }[]` for the given day number (0 = Sun)  |

### Fallback resilience

If `/drop-down/locations` or `/drop-down/options` fail, the service falls back to hardcoded data so the form remains usable:

```ts
// Fallback locations
[{ id: 1, name: 'dentro' }, { id: 2, name: 'fuori' }]

// Fallback options
[{ id: 1, name: 'seggiolino' }, { id: 2, name: 'stufa' }]
```

Time slot failures (`/drop-down/hours/:day`) result in an empty dropdown and a visible error message; the user cannot proceed without selecting a time.

---

## Anti-Spam Protection

A client-side rate limiter is implemented using a `useRef` timestamp buffer:

- The last 3 submission timestamps are stored in memory.
- If 3 submissions occur within **2 000 ms**, the session is **permanently blocked** for its lifetime.
- The blocked state persists until the user refreshes the page (it is reset by `handleReset` as well).
- Error message shown: *"Troppi tentativi ravvicinati. Sessione bloccata."*

---

## Reservation Flow

```
User opens /reservation
        ↓
Hero section renders with parallax
        ↓
User fills the form
        ↓
User selects a date → GET /drop-down/hours/:day → time slots populate
        ↓
User submits → anti-spam check
        ↓
Frontend field validation (required fields, email/phone format, guest limit)
        ↓
Business rules check (date range, contact method, group size)
        ↓
Parallel fetch: GET /drop-down/locations  +  GET /drop-down/options
        ↓
Payload mapping: Prenotazione → ReservationRequest
        ↓
POST /reservation
        ↓
Success screen shown
        ↓
User receives confirmation via WhatsApp / Telegram / Email
        ↓
Reservation becomes valid only after restaurant confirms
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com/api
```

The variable must be prefixed with `NEXT_PUBLIC_` so it is available in the browser bundle.

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

The browser opens automatically at `http://localhost:3000` (via `open-cli`).

### Build for production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```
