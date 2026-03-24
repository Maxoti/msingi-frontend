# Msingi Frontend

A React-based school management system built for Kenyan CBC (Competency-Based Curriculum) schools. Handles students, exams, fees, attendance, timetables, staff, and AI-powered academic analysis — all under one roof.

---

## Tech Stack

| Layer | Choice |
|---|---|
| UI | React 18 + Vite |
| State | Redux Toolkit |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| HTTP | Axios |
| AI | Groq (via backend proxy) |

---

## Project Structure

```
src/
├── app/                  # App shell (routes, store, providers)
├── config/               # API base URLs, environment variables
├── layouts/              # AdminLayout, AuthLayout, ParentLayout, Sidebar, Topbar
├── modules/              # Feature modules (one folder per domain)
│   ├── academicTerms/
│   ├── artificial_Intelligence/
│   ├── attendance/
│   ├── auth/
│   ├── classes/
│   ├── dashboard/
│   ├── exams/
│   ├── fees/
│   ├── school/
│   ├── staff/
│   ├── students/
│   ├── subjects/
│   └── timetable/
└── shared/               # Reusable components, hooks, utils
    ├── components/       # Button, Modal, Table
    ├── hooks/            # useApi, useAuth
    └── utils/            # currency.js, formatDate.js
```

Each module follows the same shape:
```
modules/<feature>/
├── <feature>.slice.js    # Redux state (actions + reducers)
├── <Feature>Page.jsx     # Route-level component
├── api.js                # Axios calls for this module (if needed)
└── components/           # Module-scoped components
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see `src/config/api.js` for base URL)

### Installation

```bash
git clone https://github.com/maxoti/msingi-frontend.git
cd msingi-frontend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

All env vars must be prefixed with `VITE_` to be accessible in the app. See `src/config/env.js` for how they are consumed.

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

---

## Modules

### Auth
Login and registration pages. Auth state lives in `auth.slice.js`. The `useAuth` hook exposes the current user and role.

### Dashboard
Landing page after login. Displays summary stats per role (admin, teacher, parent).

### Students
Student list, profile view, and create/edit form. Supports search and filtering by class.

### Exams
Full exam management — create exams, add subjects, enter results. Includes a results modal, delete confirmation, and pre-built CBC subject constants.

### Fees
Fee structure management, invoice generation, M-Pesa payment integration, and defaulter tracking. Broken into tabs: Dashboard, Structures, Invoices, Payments, Pending M-Pesa, Defaulters.

### Attendance
Mark and view student attendance by class and date.

### Timetable
Create and view class timetables.

### Staff
Staff list with create/edit support.

### Academic Terms
Manage term dates and academic calendar.

### Classes & Subjects
Manage class groups and the subjects assigned to them.

### AI — Exam Analyzer
Sends exam scores to the backend AI endpoint and renders a structured academic analysis: performance summary, risk assessment, subject breakdown, and recommendations. Built for CBC context.

### School Onboarding
Initial setup flow for new schools joining the platform.

---

## Shared

### Components
| Component | Purpose |
|---|---|
| `Button.jsx` | Consistent button styles across the app |
| `Modal.jsx` | Reusable modal wrapper |
| `Table.jsx` | Sortable, reusable data table |

### Hooks
| Hook | Purpose |
|---|---|
| `useAuth` | Access current user, role, and logout |
| `useApi` | Wrapper around Axios with loading/error state |

### Utils
| Utility | Purpose |
|---|---|
| `currency.js` | Format KES amounts |
| `formatDate.js` | Consistent date display across the app |

---

## Roles & Layouts

| Role | Layout | Access |
|---|---|---|
| Admin | `AdminLayout` | Full access |
| Teacher | `AdminLayout` | Students, exams, attendance, timetable |
| Parent | `ParentLayout` | Own child's results, fees, attendance |

Route guards are handled in `src/app/routes.jsx`.

---

## Contributing

1. Branch off `main` — use `feature/<name>` or `fix/<name>`
2. Keep changes scoped to one module at a time
3. New features need a `.slice.js` and a page component at minimum
4. Run `npm run lint` before opening a PR