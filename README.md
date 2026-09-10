# LifePulse — Life Insurance Sales Reporting & Analytics Portal

A runnable React + TypeScript + Vite front end for an internal life-insurance
sales reporting portal. It replaces the batch-file download workflow with a
live dashboard and four reports: Submission, Issuance, Pending and WPI Dump.

All data is fictional and generated locally. No real customer data is used.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

```bash
npm run build     # type-check + production build
npm run preview   # serve the production build
```

## Sign-in and hierarchy

`/login` resolves an email against the mock roster in `src/data/orgData.ts`.
There is no password check and no token — see the note in
`src/context/AuthContext.tsx` for the single place to swap in a real endpoint.
Three demo accounts (national, zonal, branch) are on the sign-in screen.

The org chart runs NSM → SRZSM → ZSM → TM → ISM → ISO → Advisor. Every
submission, issuance, pending and WPI record carries the `employeeId` of the
advisor who owns it, so scoping a report to a person means intersecting records
with that person's subtree. The signed-in user's own id is the widest book they
can see; **My team** lists their immediate reports with each person's numbers
for the period, lets you drill further down the line, and opens anyone's book
across all five reports.

## Requirements for information (RFI)

Each pending case carries its RFI list: requirement, category, who it sits with
(customer, advisor, branch ops, underwriting), when it was raised, the due date
against a per-category SLA, current status and the follow-up history. The
Pending page adds an RFI summary strip (open, past due, awaiting review, closed,
average open age) that doubles as a filter, an open-RFI column on the table, and
a detail drawer on any row showing the case summary and every requirement with
its follow-up timeline.

## What's inside

**Global filters** (`src/components/filters`) live in a React context, so the
period and every dimension filter apply across all five pages. FTD / MTD / YTD /
ITD plus a custom date range; an advanced drawer for product, channel, region,
branch, manager, status and premium band; removable chips for whatever is
applied; Apply, Clear and Reset.

YTD follows the Indian financial year (1 April onward). ITD runs from the
book's inception date. Changing the period recomputes every KPI, chart and
table, including the previous-period comparison behind each percentage change.

**Dashboard** — eight executive KPIs with sparklines and previous-period deltas,
a submission-against-issuance trend, premium performance, an issued-mix donut
that switches between product / channel / region / policy type, channel
performance bars, regional rankings and an advisor leaderboard.

**Drill-down** — clicking a donut segment, a channel bar or a region row applies
that value as a global filter. On the Pending page, clicking an ageing band or a
reason narrows the table; the WPI page does the same for reason and status.

**DataTable** (`src/components/tables/DataTable.tsx`) is the shared table:
search, sortable columns, pagination with a row-size control, a column
visibility menu, CSV export, sticky headers, horizontal scroll and row hover.

## Architecture

```
src/
  components/
    layout/     AppShell, AppSidebar, Header, PageHeader
    dashboard/  MetricCard, AnalyticsCard
    charts/     ChartCard, shared chart tokens
    tables/     DataTable
    filters/    PeriodSelector, ReportFilters, AdvancedFilterDrawer, AppliedFilterChips
    pending/    RfiDetailDrawer
    ui/         Button, Card, Input, Select, Checkbox, Tooltip, Drawer, Popover,
                StatusBadge, EmptyState, LoadingSkeleton
  pages/        Login, Dashboard, MyTeam, SubmissionReport, IssuanceReport,
                PendingReport, WpiDumpReport
  data/         reference.ts, orgData.ts, mockInsuranceData.ts
  services/     reportService.ts
  hooks/        useReportData, useMediaQuery
  context/      AuthContext, FilterContext
  types/        domain models
  utils/        formatting, CSV, cn
```

## Swapping in real APIs

Pages never touch the mock data. They call `src/services/reportService.ts`,
which returns promises. To move onto a Spring Boot backend, rewrite those
functions to `fetch` your endpoints and return the same shapes — `getDashboard`,
`getSubmissionReport`, `getIssuanceReport`, `getPendingReport`, `getWpiReport`.
The `useReportData` hook already handles loading and error states, so the
skeletons keep working unchanged.

Filtering currently runs client-side in the same module. When the backend takes
over, send `FilterState` as query parameters instead and delete the local
`filter*` helpers.

## Netlify

`public/_redirects` and `netlify.toml` both send every path to `index.html`, so
`/pending` and `/team` resolve on a refresh or a shared link instead of 404ing.
Build command `npm run build`, publish directory `dist`.

## Design notes

Navy and teal, IBM Plex Sans for the interface and IBM Plex Mono for every
figure, so numbers align down a column and stay readable at report density.
Currency uses Indian units throughout (₹8.42 Cr, ₹6.71 L). Motion is limited to
what responds to a click: the drawer, the popovers and the filter transitions.
