# SciVerify Frontend Handoff

> **Purpose:** This document describes the current SciVerify frontend so a separate backend developer can replace the local/demo data layer with a real API without having to reverse-engineer the UI.
>
> **Current status:** The frontend is a React/Vite single-page application. It is presentation-complete for the demo workflow, but it currently makes **no HTTP API calls**. All scientific tasks, models, evaluations, datasets, failures, generated code, result details, comparison metrics, reports, documentation, and settings are local or hard-coded demo data. Evaluation execution is simulated with a timer.
>
> **Important:** Any backend endpoint or request/response schema not explicitly present in the source is marked **TBD** below. Do not treat a TBD path as an existing contract.

## 1. Product and runtime summary

- Product: **SciVerify — Scientific Code-Execution Reliability Harness**
- Frontend package: `@workspace/sciverify`
- Artifact directory: `artifacts/sciverify`
- Frontend type: React 19 + Vite 7 + TypeScript
- Routing: `wouter`
- Styling: Tailwind CSS v4 with CSS variables in `src/index.css`
- UI primitives: Radix UI wrappers under `src/components/ui`
- Charts: Recharts
- Current data source: typed local constants in `src/lib/mock-data.ts` plus inline constants in `src/App.tsx`
- Current execution behavior: simulated; no arbitrary Python or other generated code is executed by this frontend
- Authentication: not implemented
- API client: not currently used
- Database access: not present in the frontend

The frontend is configured as a path-routed Replit web artifact. The artifact registration is in `artifacts/sciverify/.replit-artifact/artifact.toml`.

## 2. Pages, routes, and screens

All application screens and route definitions currently live in:

- `artifacts/sciverify/src/App.tsx`

The route table is defined at `artifacts/sciverify/src/App.tsx:272-274`. Component line ranges below refer to the current source snapshot.

| Route | Screen/component | Source location | Purpose and backend data used |
|---|---|---|---|
| `/` | `Landing` | `src/App.tsx:158-173` | Public marketing/entry screen. Static product copy and demo metrics. Links to `/docs`, `/overview`, and `/run`. |
| `/overview` | `OverviewContent` | `src/App.tsx:137-152` | Workspace dashboard with KPI cards, model performance chart, domain distribution, recent evaluations, and quick actions. Currently derives data locally from `models` and `evaluations`, plus inline metrics. |
| `/tasks` | `TasksPage` | `src/App.tsx:175-181` | Searchable/filterable scientific task fixture library. Uses `tasks`. |
| `/tasks/:id` | `TaskDetail` | `src/App.tsx:189-195` | Scientific task detail, inputs, outputs, criteria, reference answer, metadata, and copy-reference-code action. Uses `taskById(id)`. |
| `/run` | `RunPage` | `src/App.tsx:197-207` | Four-step evaluation wizard: choose task, configure model/prompt/runtime settings, simulate execution, then navigate to results. No backend request is made. |
| `/run?task=<task-id>` | `RunPage` | `src/App.tsx:191` generates the link; `src/App.tsx:197-207` renders the page | The task detail page creates this query string, but `RunPage` does not currently parse or apply the `task` query parameter. The wizard always initializes to the first task. This is a frontend gap to fix during backend integration. |
| `/results/:id` | `ResultsPage` | `src/App.tsx:209-217` | Evaluation detail screen with tabs for overview, generated code, outputs, visualizations, analysis, and logs. Uses `evaluationById(id)` and local/static result details. |
| `/comparison` | `ComparisonPage` | `src/App.tsx:235-239` | Model leaderboard, reliability chart, and benchmark matrix. Rows and chart data are inline constants. |
| `/datasets` | `DatasetsPage` | `src/App.tsx:241-245` | Searchable dataset catalog and manifest buttons. Uses `datasets`. |
| `/reports` | `ReportsPage` | `src/App.tsx:247-249` | Reliability report summary, failure taxonomy chart, and failure analysis table. Uses `failures` plus inline report copy. |
| `/docs` | `DocsPage` | `src/App.tsx:251-264` | In-app documentation with client-side section switching. Documentation content is an inline `docs` object. |
| `/settings` | `SettingsPage` | `src/App.tsx:266-270` | Workspace identity, evaluation-default toggles, and local status card. Controls are local-only and are not persisted to a backend. |
| Any unmatched path | `EmptyState` inside `Shell` | `src/App.tsx:273-274`, `src/App.tsx:187` | Displays “Route not found”. |

### Shared shell/navigation

`Shell` is defined in `src/App.tsx:82-125` and wraps all workspace pages except the landing screen. It provides:

- Fixed responsive sidebar
- Workspace navigation links
- Header “Run evaluation” action
- Hard-coded demo user display: `Sher`, `Student Researcher`
- Hard-coded workspace display: `Sher's workspace / research-harness`
- Hard-coded status labels: “Sandbox healthy”, “Workspace online”, and `DEMO`

The sidebar navigation is defined in `src/App.tsx:26-42`:

- Workspace: Overview, Scientific tasks, Run evaluation, Results
- Research: Model comparison, Datasets, Reports
- Resources: Documentation, Settings

## 3. API calls and backend contracts

### 3.1 Actual frontend network calls: none

There are currently no calls to:

- `fetch`
- Axios
- `XMLHttpRequest`
- Any `/api/*` path
- `useQuery`
- `useMutation`
- A generated API hook

`@tanstack/react-query` is installed and a `QueryClientProvider` is mounted, but no query or mutation is registered. The provider setup is in `src/App.tsx:24` and `src/App.tsx:276-278`.

The frontend imports local data directly:

```ts
import {
  codeSample,
  datasets,
  evaluationById,
  evaluations,
  failures,
  modelById,
  models,
  referenceCode,
  taskById,
  tasks,
} from '@/lib/mock-data';
```

This import is in `src/App.tsx:19-22`.

### 3.2 Browser/platform operations that are not backend API calls

| Operation | Source | Current behavior |
|---|---|---|
| Copy reference code | `src/App.tsx:191` | Calls `navigator.clipboard?.writeText(referenceCode)`. |
| Copy generated code | `src/App.tsx:215` and `src/App.tsx:227` | Calls `navigator.clipboard?.writeText(codeSample)`. |
| Print/export result | `src/App.tsx:145`, `src/App.tsx:216` | Calls `window.print()`. No file is uploaded or generated by a backend. |
| Print/export comparison | `src/App.tsx:238` | Calls `window.print()`. |
| Print/export report | `src/App.tsx:248` | Calls `window.print()`. |
| Settings reset | `src/App.tsx:268` | Calls `localStorage.removeItem('sciverify-settings')`. No code currently writes this key. |
| Simulated run completion | `src/App.tsx:204` | Uses `window.setTimeout(..., 2600)` and navigates to `/results/eval-1042`. |

### 3.3 External resource requests

These are browser resource loads, not SciVerify backend APIs:

- Google Fonts from `src/index.css:1`:
  - `https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap`
- Google Fonts preconnect/font stylesheet from `src/index.html:16-18`, using Inter.
- GitHub placeholder link from `src/App.tsx:161`: `https://github` in the landing navigation. This is a generic placeholder and is not a GitHub API call.

### 3.4 Backend operations required by the current screens

The following are the operations the UI needs once the local data is replaced. **The endpoint paths and exact HTTP contracts are TBD because the frontend does not define them yet.** The response compatibility notes describe the minimum shape the current components consume.

| Operation | Method | Endpoint path | Request body/query | Frontend-compatible response shape | Consuming screens |
|---|---:|---|---|---|---|
| List task fixtures | TBD, likely `GET` | **TBD** | Optional domain/filter/search query. Current UI filters locally by `domain`, `title`, and `description`. | `ScientificTask[]`, or a paginated envelope that exposes an equivalent `items: ScientificTask[]`. | `/overview`, `/tasks`, `/run` |
| Get one task fixture | TBD, likely `GET` | **TBD** | Path identifier corresponding to `ScientificTask.id`. | One `ScientificTask`. | `/tasks/:id`, `/run` |
| Create a task fixture | TBD, likely `POST` | **TBD** | No frontend form exists. A create request schema is **TBD**. The current “Add task” button only resets the filter. | Created `ScientificTask`, or validation errors. | `/tasks` |
| List models/providers | TBD, likely `GET` | **TBD** | Optional provider/availability filters are **TBD**. | `Model[]`. | `/overview`, `/run`, `/comparison` |
| List evaluations | TBD, likely `GET` | **TBD** | Optional period (`7d`, `30d`, `90d`), task, model, status, and pagination filters. The current period selector only changes displayed copy; it does not filter data. | `Evaluation[]`, or `{ items: Evaluation[], total?: number }`. | `/overview`, `/comparison`, `/reports` |
| Get evaluation detail | TBD, likely `GET` | **TBD** | Evaluation identifier from `/results/:id`. | Evaluation summary plus the detailed result contract described below. | `/results/:id` |
| Start an evaluation | TBD, likely `POST` | **TBD** | See the run request shape below. | Accepted evaluation/job with an id and status; exact async contract is **TBD**. | `/run` |
| Poll or stream evaluation status | TBD, likely `GET` or SSE/WebSocket | **TBD** | Evaluation/job identifier. | Status, progress, trace/log events, and terminal result; exact transport and shape are **TBD**. | `/run`, `/results/:id` |
| Cancel an evaluation | TBD, likely `POST` or `DELETE` | **TBD** | Evaluation/job identifier. | Updated cancelled status; exact shape is **TBD**. | No current cancel control; future backend integration candidate. |
| List datasets | TBD, likely `GET` | **TBD** | Optional domain, version, source, and search filters. | `Dataset[]`, or a paginated equivalent. | `/datasets`, `/tasks/:id`, `/overview` |
| Get dataset manifest | TBD, likely `GET` | **TBD** | Dataset identifier from `Dataset.id`. | Manifest metadata and provenance; no frontend type currently exists, so exact response is **TBD**. | `/datasets` “View manifest” action |
| List/report failure records | TBD, likely `GET` | **TBD** | Optional evaluation, task, model, failure type, severity, and date filters. | `Failure[]`, or a report envelope containing failures and aggregates. | `/reports` |
| Get comparison/benchmark aggregates | TBD, likely `GET` | **TBD** | Optional task suite, period, model, and weighting parameters. | Aggregate rows compatible with the current comparison row shape below. | `/comparison` |
| Get workspace/user settings | TBD, likely `GET` | **TBD** | Authenticated workspace context. | Workspace identity and evaluation defaults; exact settings type is **TBD**. | `/settings`, `Shell` |
| Save workspace/user settings | TBD, likely `PATCH` or `PUT` | **TBD** | Workspace identity and evaluation-default values; exact request schema is **TBD**. | Saved settings or validation errors. | `/settings` |
| Get current authenticated user/session | TBD, likely `GET` | **TBD** | No current request. | User/workspace identity; exact schema is **TBD**. | `Shell`, future auth UI |

### 3.5 Current evaluation-run input state

`RunPage` currently holds these values locally:

| Field | Current source | Current default/values | Backend note |
|---|---|---|---|
| `taskId` | `src/App.tsx:200` | `tasks[0].id` (`orbital-trajectory`) | Should identify the selected `ScientificTask`. |
| `modelId` | `src/App.tsx:201` | `models[0].id` (`gpt-4o`) | Can also be the literal `mock` from the extra option. |
| `promptVersion` | Inline `<select>` at `src/App.tsx:206` | `scientific-v3.2` or `scientific-v3.1` | Not stored in React state; the selected value is not read when starting the run. |
| `temperature` | `<Input defaultValue="0.2">` at `src/App.tsx:206` | `0.2` | Not stored/read by the current start handler. |
| `maxTokens` | `<Input defaultValue="2,048">` at `src/App.tsx:206` | Display string `2,048` | Not stored/read; should become a number in a backend request. |
| `timeout` | `<Input defaultValue="30 sec">` at `src/App.tsx:206` | Display string `30 sec` | Not stored/read; should become a numeric timeout value in a backend request. |

If the backend integration uses a JSON request, the minimum current UI selection can be represented as:

```json
{
  "taskId": "orbital-trajectory",
  "modelId": "gpt-4o",
  "promptVersion": "scientific-v3.2",
  "temperature": 0.2,
  "maxTokens": 2048,
  "timeoutSeconds": 30
}
```

This is an **integration recommendation based on visible controls, not an existing frontend type or API contract**. The actual request type is TBD until the run form stores and submits all controls.

### 3.6 Evaluation-detail response requirements

`ResultsPage` currently needs the following information:

- Evaluation summary:
  - `id`
  - task identity/title
  - model identity/name/provider
  - status
  - scientific accuracy
  - runtime
  - generated code line count
  - date
  - optional failure classification
- Reproducibility:
  - dataset pinned/version
  - random seed
  - environment/runtime version
  - model configuration
  - prompt version
- Execution:
  - runtime duration
  - stdout
  - stderr
  - exit code
  - warnings
  - package/runtime metadata
- Generated artifacts:
  - generated code
  - reference code
  - diff or comparison data
  - computed outputs
  - expected/tolerance values
  - visualization data or an image/artifact reference
- Scientific assessment:
  - reference answer
  - observed accuracy
  - method check
  - reproducibility checks
  - reviewer notes/tags

There is no `EvaluationDetail`, `ExecutionResult`, `EnvironmentMetadata`, `ScientificResult`, output, log, or visualization TypeScript interface in the current frontend. The in-app Docs API section mentions conceptual names only at `src/App.tsx:260`.

## 4. Environment variables and runtime configuration

### Variables currently read by frontend code

| Variable | Required? | Read from | Purpose |
|---|---:|---|---|
| `PORT` | Yes | `artifacts/sciverify/vite.config.ts:8-20` | Vite dev/preview server port. The config throws if missing or invalid. |
| `BASE_PATH` | Yes | `artifacts/sciverify/vite.config.ts:22-28` | Vite base path. The config throws if missing. The router derives its base from `import.meta.env.BASE_URL` in `src/App.tsx:277`. |
| `NODE_ENV` | Optional | `artifacts/sciverify/vite.config.ts:36` | Controls whether Replit development plugins are considered. |
| `REPL_ID` | Optional | `artifacts/sciverify/vite.config.ts:36` | Enables Replit Cartographer and dev-banner plugins during non-production development when defined. |
| `import.meta.env.BASE_URL` | Derived | `src/App.tsx:277` | Vite-generated base URL derived from `BASE_PATH`; passed to Wouter as the router base. |
| `import.meta.env.DEV` | Derived | `src/components/error-boundary.tsx:50` | Shows the caught error message only in Vite development mode. |

### Variables not currently read but likely needed for a real backend

| Variable | Status | Recommended use |
|---|---|---|
| `VITE_API_BASE_URL` | **TBD; not implemented** | Add only if the API is hosted on a separate origin. If the API is same-origin behind the frontend artifact, a relative `/api` base may be preferable. |
| Auth-related frontend variable | **TBD; not implemented** | Do not expose server secrets. The auth design and provider are not selected. |
| `SESSION_SECRET` | Not a frontend variable | A workspace secret exists for server-side use, but the frontend does not read it and it must never be bundled or exposed to the browser. |
| `DATABASE_URL` | Not a frontend variable | Used by backend/database packages elsewhere in the workspace, not by SciVerify frontend code. |

### Artifact-provided environment

`artifacts/sciverify/.replit-artifact/artifact.toml:26-28` sets:

```toml
[services.env]
PORT = "25889"
BASE_PATH = "/"
```

The same artifact config declares:

- Development command: `pnpm --filter @workspace/sciverify run dev`
- Production build: `pnpm --filter @workspace/sciverify run build`
- Production serving: static files from `artifacts/sciverify/dist/public`
- SPA rewrite: every path rewrites to `/index.html`

## 5. State management

### Current approach

The app uses local React state only:

- `useState` in `src/App.tsx` for filters, search fields, tabs, wizard steps, form-like controls, copy status, save status, mobile navigation, and period selection.
- `useLocation` from Wouter for route navigation and current pathname.
- A module-level `QueryClient` is created and provided, but no React Query query/mutation hooks are used.
- No Redux store.
- No Zustand store.
- No custom React Context.
- No backend cache or persisted client data layer.
- No form submission library is used in the actual screens, despite `react-hook-form` and `@hookform/resolvers` being installed.

### State by screen

| Screen/component | State | Persistence |
|---|---|---|
| `Shell` | `mobileOpen`, current Wouter location | In memory only |
| `OverviewContent` | `period` (`7d`, `30d`, `90d`) | In memory only; currently only changes chart subtitle |
| `TasksPage` | `filter`, `query` | In memory only; filtering runs against local `tasks` |
| `RunPage` | `step`, `taskId`, `modelId`, `running` | In memory only; prompt/runtime controls are uncontrolled DOM inputs |
| `ResultsPage` | `activeTab`, `copied` | In memory only |
| `CodeViewer` | `view` (`generated`, `reference`, `diff`) | In memory only |
| `DocsPage` | `section` | In memory only; no nested routes |
| `DatasetsPage` | `query` | In memory only; filtering runs against local `datasets` |
| `SettingsPage` | `saved` | In memory only |
| `ToggleRow` | `on` | In memory only; initializes from `enabled` prop |
| `ErrorBoundary` | `error` | In memory only |

### Important state gaps for backend integration

- `RunPage` does not read the `?task=` query parameter.
- `RunPage` does not store or submit prompt version, temperature, max tokens, or timeout.
- The “Save changes” settings action only shows a temporary “Saved” state; it does not read inputs or send data.
- The “Add task” and “Add dataset” actions do not open forms or upload anything.
- “View manifest” copies the dataset name to the clipboard instead of loading a manifest.
- Export buttons use browser print rather than an API or file-export endpoint.
- The overview period selector does not refetch or filter metrics.

## 6. Frontend data models and types

### 6.1 Domain types in `src/lib/mock-data.ts`

File: `artifacts/sciverify/src/lib/mock-data.ts:1-60`.

```ts
export type Domain =
  | 'Physics'
  | 'Earth Science'
  | 'Astronomy'
  | 'Climate'
  | 'Data Analysis';

export type RunStatus = 'Success' | 'Failed' | 'Partial';

export interface ScientificTask {
  id: string;
  title: string;
  domain: Domain;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  question: string;
  runtime: string;
  inputs: string[];
  outputs: string[];
  method: string;
  answer: string;
  criteria: string[];
  dataset: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  color: string;
  accent: string;
}

export interface Evaluation {
  id: string;
  taskId: string;
  modelId: string;
  status: RunStatus;
  accuracy: number;
  runtime: number;
  codeLines: number;
  date: string;
  failure?: string;
}

export interface Dataset {
  id: string;
  name: string;
  domain: Domain;
  records: string;
  source: string;
  license: string;
  version: string;
  updated: string;
  description: string;
}

export interface Failure {
  id: string;
  task: string;
  model: string;
  type: string;
  error: string;
  severity: 'High' | 'Medium' | 'Low';
  resolution: string;
}
```

### 6.2 Local data helper functions

File: `src/lib/mock-data.ts:205-207`.

```ts
taskById(id: string): ScientificTask
modelById(id: string): Model
evaluationById(id: string): Evaluation
```

Each helper uses `Array.find()` and falls back to the first item when the requested id is unknown. A real API integration should decide whether unknown ids return a 404, an error state, or a not-found screen instead of silently falling back.

### 6.3 App-specific component prop types

These types are declared inline in `src/App.tsx`:

| Component | Props |
|---|---|
| `Logo` | `{ large?: boolean }` |
| `StatusBadge` | `{ status: Evaluation['status'] }` |
| `PageHeader` | `{ eyebrow?: string; title: string; description?: string; actions?: ReactNode }` |
| `Shell` | `{ children: ReactNode }` |
| `MetricCard` | `{ label: string; value: string; delta?: string; icon: typeof Activity; tone?: 'cyan' \| 'violet' \| 'amber' \| 'green' }` |
| `MiniSparkline` | `{ data: number[]; color?: string }` |
| `QuickAction` | `{ href: string; icon: typeof Play; title: string; copy: string }` |
| `TaskCard` | `{ task: ScientificTask; index: number }` |
| `TaskDetail` | `{ id: string }` |
| `InfoBlock` | `{ title: string; items: string[] }` |
| `MetaRow` | `{ label: string; value: string }` |
| `ResultsPage` | `{ id: string }` |
| `OrbitPlot` | `{ large?: boolean }` |
| `CodeViewer` | `{ copied: boolean; copyCode: () => void }` |
| `OutputRow` | `{ label: string; value: string; expected: string; good?: boolean }` |
| `Analysis` | `{ task: ScientificTask; run: Evaluation }` |
| `ToggleRow` | `{ title: string; copy: string; enabled: boolean }` |

### 6.4 Error-boundary types

File: `src/components/error-boundary.tsx:8-22`.

```ts
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}
```

### 6.5 Inferred inline data shapes that need backend equivalents

These are not exported TypeScript interfaces:

#### Overview model performance

Created at `src/App.tsx:139`:

```ts
{
  name: string;
  execution: number;
  accuracy: number;
  failed: number;
}
```

#### Overview domain distribution

Created at `src/App.tsx:140`:

```ts
{
  name: string;
  value: number;
  color: string;
}
```

#### Comparison leaderboard rows

Created at `src/App.tsx:236`:

```ts
{
  model: string;
  tasks: number;
  execution: string; // percentage display, for example "72%"
  accuracy: string;  // percentage display
  runtime: string;   // display, for example "14.8s"
  failure: string;   // percentage display
  score: string;     // display, for example "78.4"
}
```

#### Comparison chart rows

Created at `src/App.tsx:237`:

```ts
{
  name: string;
  reliability: number;
  accuracy: number;
}
```

#### Documentation sections

Created at `src/App.tsx:253-260`:

```ts
Record<string, {
  title: string;
  copy: string;
  code?: string;
}>
```

## 7. Mock and placeholder data inventory

### 7.1 Main typed mock repository

File: `artifacts/sciverify/src/lib/mock-data.ts`.

| Lines | Data | Contents/replacement target |
|---:|---|---|
| `1-2` | `Domain`, `RunStatus` | Shared local unions; backend may expose strings that should be validated/mapped. |
| `4-18` | `ScientificTask` | Task fixture contract. Replace `tasks` with task API data. |
| `20-26` | `Model` | Model/provider catalog. Replace `models` with backend/provider data. |
| `28-38` | `Evaluation` | Evaluation summary. Replace `evaluations` with evaluation API data. |
| `40-50` | `Dataset` | Dataset catalog summary. Replace `datasets` with dataset API data. |
| `52-60` | `Failure` | Failure-analysis record. Replace `failures` with report/failure API data. |
| `62-138` | `tasks` | Five task fixtures: orbital trajectory, gravitational force, NOAA climate, exoplanet transit, and glacier melt. |
| `140-144` | `models` | GPT-4o, Claude 3.5, and Gemini 1.5. |
| `146-159` | `evaluations` | Twelve demo evaluations with success/failed/partial statuses and summary metrics. |
| `161-166` | `datasets` | Four demo datasets. |
| `168-174` | `failures` | Five demo failure records. |
| `176-201` | `codeSample` | Hard-coded generated Python code for the orbital example. |
| `203` | `referenceCode` | Derived from `codeSample` with two string replacements. |
| `205-207` | `taskById`, `modelById`, `evaluationById` | Local lookup helpers with first-item fallback. |

### 7.2 Inline mock/placeholder data in `App.tsx`

| Lines | Data/behavior | Replacement work |
|---:|---|---|
| `139` | `performance` array derived from `models` with hard-coded execution/accuracy/failure percentages. | Replace with dashboard aggregate API response. |
| `140` | `domains` distribution with five hard-coded percentages and colors. | Replace with task-domain aggregate API response; colors can remain frontend presentation metadata. |
| `143` | KPI values: `33.4%`, `58.0%`, `05`, `03`. | Replace with workspace metrics API response. |
| `145` | “Aggregate across 12 evaluations” copy. | Replace with API-provided count and selected-period label. |
| `148` | Recent evaluations rendered from local `evaluations`. | Replace with evaluation list query. |
| `158-171` | Landing page copy, metrics (`05`, `06`, `100%`, `12`), orbit illustration labels, `92.3%`, and seed `482901`. | Replace only if landing page should be live/tenant-specific; otherwise these can remain marketing copy. |
| `191` | Task metadata hard-codes `Python 3.12` and `Pinned · v2.1` in addition to local task fields. | Use task/fixture metadata from backend. |
| `197-207` | Run workflow and trace are simulated. | Replace with create-run request plus status polling/streaming. |
| `204` | `setTimeout(..., 2600)` always navigates to `/results/eval-1042`. | Replace with actual job completion and returned evaluation id. |
| `216` | Results header always displays “Execution successful”. | Derive from returned evaluation status. |
| `216` | Result metadata: Python `3.12.2`, NumPy `2.1.3`, SciPy `1.14.1`, seed `482901`, exit code `0`. | Use execution/environment result payload. |
| `216` | Reproducibility checks are a fixed five-item success list. | Render backend check results. |
| `216-233` | Generated output, orbit plot, outputs, analysis, reviewer notes, and execution logs are static. | Replace with evaluation-detail payload and artifact/log endpoints as appropriate. |
| `230` | Output rows: orbital period, mean altitude, energy drift, samples generated. | Use structured scientific output values and tolerance checks. |
| `233` | Execution log, environment, warnings, stderr, exit code are static. | Use captured execution trace. |
| `236` | Three comparison leaderboard rows. | Replace with benchmark aggregate API response. |
| `237` | Three comparison chart rows. | Replace with benchmark aggregate API response. |
| `238` | Weighted score copy: `60% execution · 40% accuracy`. | Make weighting backend/config-driven if the benchmark supports custom weights. |
| `244` | Hard-coded `1.23m records indexed`. | Replace with dataset aggregate or remove. |
| `248` | Reliability report title/date/counts, executive summary, included sections, and taxonomy copy. | Replace with report API data. |
| `253-260` | Documentation object with seven sections. | Static docs can remain frontend-owned; do not require backend unless documentation becomes CMS-managed. |
| `268` | Settings defaults: workspace name, owner, description; status `DEMO`, fixtures `05`, evaluations `12`, schema `v0.4.2`. | Replace with authenticated workspace/settings response. |
| `270` | Toggle rows initialize as enabled and only change local state. | Read/write settings through backend. |

## 8. Authentication, session, and token handling

There is currently **no authentication or session implementation** in the frontend.

- No login, logout, signup, callback, or protected-route screens exist.
- No auth provider SDK is imported.
- No bearer token is read, stored, refreshed, or attached to requests.
- No `Authorization` header is created.
- No API client/interceptor exists.
- No current-user request exists.
- The displayed user (`Sher`) and workspace (`research-harness`) are hard-coded in `Shell` at `src/App.tsx:107-112` and `src/App.tsx:118`.
- `localStorage` is not used for authentication. The only explicit use is removing `sciverify-settings` at `src/App.tsx:268`.
- Generic Radix sidebar code contains a cookie for sidebar UI state, not authentication. It is in `src/components/ui/sidebar.tsx` and is not an app auth mechanism.
- `SESSION_SECRET` exists as a workspace secret for server-side use, but must not be read by or exposed to this frontend.

### Authentication contract: TBD

The backend developer must decide:

1. Authentication provider and login flow.
2. Whether the frontend uses same-origin session cookies or a bearer-token/OIDC flow.
3. Current-user/workspace endpoint.
4. How unauthorized API responses are surfaced.
5. Whether all routes are protected or the landing/docs pages remain public.

If cookie sessions are selected, the eventual API client will need appropriate `credentials` handling and CSRF protection for state-changing requests. If bearer tokens are selected, token storage and refresh behavior must be designed before adding calls; do not put server secrets into `VITE_*` variables.

## 9. NPM dependencies

All dependencies are declared under `devDependencies` in `artifacts/sciverify/package.json:12-75`; there is no separate `dependencies` block.

`package.json` uses `catalog:` for packages centrally managed in the workspace. The effective catalog declarations are in `pnpm-workspace.yaml:43-67`. Direct ranges below are copied from `package.json`; `catalog:` entries are shown with their workspace catalog declaration.

### Radix UI and form/UI dependencies

| Package | `package.json` declaration | Effective catalog/resolution note |
|---|---|---|
| `@hookform/resolvers` | `^3.10.0` | Direct range |
| `@radix-ui/react-accordion` | `^1.2.4` | Direct range |
| `@radix-ui/react-alert-dialog` | `^1.1.7` | Direct range |
| `@radix-ui/react-aspect-ratio` | `^1.1.3` | Direct range |
| `@radix-ui/react-avatar` | `^1.1.4` | Direct range |
| `@radix-ui/react-checkbox` | `^1.1.5` | Direct range |
| `@radix-ui/react-collapsible` | `^1.1.4` | Direct range |
| `@radix-ui/react-context-menu` | `^2.2.7` | Direct range |
| `@radix-ui/react-dialog` | `^1.1.7` | Direct range |
| `@radix-ui/react-dropdown-menu` | `^2.1.7` | Direct range |
| `@radix-ui/react-hover-card` | `^1.1.7` | Direct range |
| `@radix-ui/react-label` | `^2.1.3` | Direct range |
| `@radix-ui/react-menubar` | `^1.1.7` | Direct range |
| `@radix-ui/react-navigation-menu` | `^1.2.6` | Direct range |
| `@radix-ui/react-popover` | `^1.1.7` | Direct range |
| `@radix-ui/react-progress` | `^1.1.3` | Direct range |
| `@radix-ui/react-radio-group` | `^1.2.4` | Direct range |
| `@radix-ui/react-scroll-area` | `^1.2.4` | Direct range |
| `@radix-ui/react-select` | `^2.1.7` | Direct range |
| `@radix-ui/react-separator` | `^1.1.3` | Direct range |
| `@radix-ui/react-slider` | `^1.2.4` | Direct range |
| `@radix-ui/react-slot` | `^1.2.0` | Direct range |
| `@radix-ui/react-switch` | `^1.1.4` | Direct range |
| `@radix-ui/react-tabs` | `^1.1.4` | Direct range |
| `@radix-ui/react-toast` | `^1.2.7` | Direct range |
| `@radix-ui/react-toggle` | `^1.1.3` | Direct range |
| `@radix-ui/react-toggle-group` | `^1.1.3` | Direct range |
| `@radix-ui/react-tooltip` | `^1.2.0` | Direct range |
| `cmdk` | `^1.1.1` | Direct range |
| `embla-carousel-react` | `^8.6.0` | Direct range |
| `input-otp` | `^1.4.2` | Direct range |
| `react-day-picker` | `^9.11.1` | Direct range |
| `react-hook-form` | `^7.55.0` | Direct range; not used by current screen components |
| `react-resizable-panels` | `^2.1.7` | Direct range |
| `sonner` | `^2.0.7` | Direct range |
| `vaul` | `^1.1.2` | Direct range |

### Replit, React, build, charts, and utility dependencies

| Package | `package.json` declaration | Workspace catalog declaration where applicable |
|---|---|---|
| `@replit/vite-plugin-cartographer` | `catalog:` | `^0.5.21` |
| `@replit/vite-plugin-dev-banner` | `catalog:` | `^0.1.1` |
| `@replit/vite-plugin-runtime-error-modal` | `catalog:` | `^0.0.6` |
| `@tailwindcss/typography` | `^0.5.15` | Direct range |
| `@tailwindcss/vite` | `catalog:` | `^4.1.14` |
| `@tanstack/react-query` | `catalog:` | `^5.90.21` |
| `@types/node` | `catalog:` | `^25.3.3` |
| `@types/react` | `catalog:` | `^19.2.0` |
| `@types/react-dom` | `catalog:` | `^19.2.0` |
| `@vitejs/plugin-react` | `catalog:` | `^5.0.4` |
| `class-variance-authority` | `catalog:` | `^0.7.1` |
| `clsx` | `catalog:` | `^2.1.1` |
| `date-fns` | `^3.6.0` | Direct range; not used by current screen code |
| `framer-motion` | `catalog:` | `^12.23.24`; not used by current `App.tsx` |
| `lucide-react` | `catalog:` | `^0.545.0` |
| `next-themes` | `^0.4.6` | Direct range; not used by current `App.tsx` |
| `react` | `catalog:` | `19.1.0` |
| `react-dom` | `catalog:` | `19.1.0` |
| `react-icons` | `^5.4.0` | Direct range; not used by current `App.tsx` |
| `recharts` | `^2.15.2` | Direct range |
| `tailwind-merge` | `catalog:` | `^3.3.1` |
| `tailwindcss` | `catalog:` | `^4.1.14` |
| `tw-animate-css` | `^1.4.0` | Direct range |
| `vite` | `catalog:` | `^7.3.2` |
| `wouter` | `^3.3.5` | Direct range |
| `zod` | `catalog:` | `^3.25.76`; not used by current screen code |
| `@workspace/api-client-react` | `workspace:*` | Workspace package reference and TypeScript project reference; no import is used by the current SciVerify source. |

### Dependency notes for backend integration

- React Query is already available if the backend implementation wants query/mutation caching.
- The current frontend does not have a dedicated API client module.
- A backend integration should likely add a focused client module such as `src/lib/api.ts` and query hooks, rather than placing `fetch` calls directly inside the page components.
- No dependency should be added solely to execute generated scientific code in the browser. Execution should remain isolated on the backend/runner.

## 10. Folder and file structure

```text
artifacts/sciverify/
├── .replit-artifact/
│   └── artifact.toml              # Web artifact, workflow, port, SPA rewrite
├── components.json                # shadcn/ui aliases and Tailwind settings
├── index.html                     # HTML shell, title/meta, root div, main.tsx entry
├── package.json                   # Frontend scripts and dependencies
├── tsconfig.json                  # TypeScript config; @/* -> src/*
├── vite.config.ts                 # Vite config, required env, aliases, build/preview
├── src/
│   ├── App.tsx                    # Router, shell, every product screen, local state
│   ├── index.css                  # Theme tokens, Tailwind imports, global styles
│   ├── main.tsx                   # React entry point and ErrorBoundary mounting
│   ├── components/
│   │   ├── error-boundary.tsx     # App-level error boundary and dev fallback
│   │   └── ui/                    # Reusable Radix/shadcn-style UI primitives
│   ├── hooks/
│   │   ├── use-mobile.tsx         # Responsive breakpoint hook
│   │   └── use-toast.ts           # Toast hook utility
│   ├── lib/
│   │   ├── mock-data.ts           # All primary typed demo entities and code samples
│   │   └── utils.ts               # cn() Tailwind class merge helper
│   └── pages/
│       └── not-found.tsx          # Standalone not-found component; current router uses
│                                  # an inline EmptyState instead
├── dist/
│   └── public/                    # Generated production build output; do not edit
└── node_modules/                  # Installed dependencies; do not commit
```

### UI primitive inventory

`src/components/ui` contains reusable components for:

```text
accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb,
button-group, button, calendar, card, carousel, chart, checkbox, collapsible,
command, context-menu, dialog, drawer, dropdown-menu, empty, field, form,
hover-card, input-group, input-otp, input, item, kbd, label, menubar,
navigation-menu, pagination, popover, progress, radio-group, resizable,
scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner,
spinner, switch, table, tabs, textarea, toaster, toast, toggle-group, toggle,
tooltip
```

These are generic presentation components. Backend integration should generally modify page/data code, not the primitives, unless loading/error/pagination states require new shared UI.

## 11. Build, install, and local development

Run commands from the workspace root.

### Install

```bash
pnpm install
```

The repository uses pnpm workspaces. The workspace package is `@workspace/sciverify`.

### Start the frontend in development

The Vite config requires both `PORT` and `BASE_PATH`:

```bash
PORT=25889 BASE_PATH=/ pnpm --filter @workspace/sciverify run dev
```

Open:

```text
http://localhost:25889/
```

The artifact workflow already supplies these values in Replit:

```bash
pnpm --filter @workspace/sciverify run dev
```

with `PORT=25889` and `BASE_PATH=/`.

### Production build

```bash
PORT=25889 BASE_PATH=/ pnpm --filter @workspace/sciverify run build
```

Output:

```text
artifacts/sciverify/dist/public
```

### Preview the production build

```bash
PORT=25889 BASE_PATH=/ pnpm --filter @workspace/sciverify run serve
```

### Typecheck

Frontend only:

```bash
pnpm --filter @workspace/sciverify run typecheck
```

Entire workspace:

```bash
pnpm run typecheck
```

### Tests

`artifacts/sciverify/package.json` has no `test` script. There is currently no frontend test suite configured.

## 12. Backend integration plan

The safest integration sequence is:

1. Preserve the exported local model names or replace them with equivalent shared types.
2. Add a typed API client module and a single configurable API base URL.
3. Add authenticated current-user/workspace loading before replacing the hard-coded `Shell` identity.
4. Replace `tasks`, `models`, `evaluations`, `datasets`, and `failures` reads one screen at a time.
5. Add explicit loading, empty, unauthorized, not-found, and server-error states.
6. Change `/tasks/:id` to return a real 404/not-found state instead of `taskById` fallback behavior.
7. Fix `RunPage` to parse `?task=<id>` and store all configuration controls in state.
8. Replace the simulated `setTimeout` with a real evaluation job request.
9. Add polling or streaming for progress and logs, then navigate using the returned evaluation id.
10. Replace hard-coded result tabs with an evaluation-detail response and artifact/log loading strategy.
11. Replace comparison and report constants with aggregate/report endpoints.
12. Persist settings through authenticated workspace endpoints.
13. Add tests for API parsing, route behavior, run submission, terminal job states, and error states.

### Suggested frontend/backend boundary

Keep the following concerns separate:

- **Frontend:** route rendering, filters, charts, tabs, copy/print interactions, optimistic visual state.
- **API:** task/model/dataset/evaluation/report persistence and authorization.
- **Runner:** isolated generated-code execution, process limits, filesystem/network restrictions, dependency pinning, timeout enforcement, stdout/stderr capture.
- **Evaluator:** scientific correctness, tolerance comparison, reproducibility checks, failure taxonomy, and aggregate metrics.

The current Docs page explicitly warns that production execution must use an isolated sandbox. The backend must never execute generated code inside the main API server process without isolation.

## 13. Known frontend limitations and integration hazards

- The app is one large `src/App.tsx` file; page extraction may help once API hooks are introduced.
- `RunPage` has visible controls that are not connected to state or submission.
- `?task=` links are generated but ignored.
- Unknown task/model/evaluation ids silently resolve to the first mock object.
- Current result navigation always uses `eval-1042` after the simulated run.
- Current status/accuracy/runtime values are not authoritative.
- `window.print()` is not a real report/export API.
- Add-task and add-dataset controls are placeholders.
- Settings do not persist even though a reset local-storage action exists.
- The `ResultsPage` route accepts any `:id`, but no loading/not-found/error state exists.
- There are no pagination controls or server-side filtering contracts yet.
- The landing page contains a placeholder GitHub URL.
- No frontend API base URL exists.
- No authentication boundary exists.
- No frontend tests are currently configured.
