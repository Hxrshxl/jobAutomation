<div align="center">

# 🤖 Job Automation Pipeline

### *From job boards to your inbox — fully automated.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Playwright](https://img.shields.io/badge/Playwright-Scraping-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![Google](https://img.shields.io/badge/Google-Drive%20%2B%20Sheets-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://drive.google.com/)

<br/>

> **7 phases · 14 days · fully automated job hunting pipeline**
>
> Scrapes → Scores → Tailors your resume → Uploads to Drive → Logs to Sheets. Every 12 hours.

<br/>

</div>

---

## 📖 What This Does

Most job hunting is manual, repetitive, and exhausting. This pipeline eliminates that entirely.

Every **12 hours**, it automatically:

| Step | Action | Detail |
|------|---------|--------|
| 1️⃣ | **Scrapes** | Fresh jobs from LinkedIn, Naukri, Indeed, Wellfound & company boards |
| 2️⃣ | **Filters** | Removes senior/lead/irrelevant roles using rule-based logic |
| 3️⃣ | **Scores** | Each job 0–100 on skill match, title, experience & recency |
| 4️⃣ | **Generates** | A tailored, ATS-optimized LaTeX resume for every job scoring ≥ 75 |
| 5️⃣ | **Compiles** | Each resume → `Harshal Bhagat - CompanyName.pdf` |
| 6️⃣ | **Uploads** | Every PDF to Google Drive with a public shareable link |
| 7️⃣ | **Logs** | Everything to Google Sheets — your daily apply command centre |

You wake up to a Sheet full of scored jobs, ready-to-send resumes, and direct application links.

---

## 🏗️ Architecture

```
                    ┌─────────────────────────────────┐
                    │          ORCHESTRATOR            │
                    │     services/orchestrator.ts     │
                    └────────────┬────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐   ┌──────────────────┐   ┌────────────────────┐
│  JOB FETCHER    │   │ FILTER + SCORER  │   │  RESUME GENERATOR  │
│                 │   │                  │   │                    │
│ • LinkedIn      │──▶│ • Exp gate       │──▶│ • Read base .tex   │
│ • Naukri        │   │ • Title filter   │   │ • AI prompt fill   │
│ • Indeed        │   │ • Keyword match  │   │ • LaTeX validate   │
│ • Wellfound     │   │ • Score 0–100    │   │ • pdflatex compile │
│ • Company APIs  │   │ • Threshold ≥ 75 │   │ • Named PDF output │
└─────────────────┘   └──────────────────┘   └────────────────────┘
                                                        │
                    ┌───────────────────────────────────┘
                    │
    ┌───────────────┴──────────────────┬───────────────────────┐
    ▼                                  ▼                       ▼
┌──────────────┐            ┌────────────────────┐   ┌────────────────┐
│ GOOGLE DRIVE │            │  GOOGLE SHEETS     │   │   MONGODB      │
│              │            │                    │   │                │
│ • Upload PDF │            │ • Append job row   │   │ • RawJob       │
│ • Set public │            │ • Drive link       │   │ • ScoredJob    │
│   share link │            │ • Applied? column  │   │ • JobResult    │
└──────────────┘            └────────────────────┘   └────────────────┘
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, TypeScript) |
| **Database** | MongoDB Atlas + Mongoose ODM |
| **Scraping** | Playwright (headless Chromium) |
| **AI Generation** | OpenAI GPT-4o / Anthropic Claude |
| **Resume Rendering** | LaTeX + `pdflatex` |
| **Cloud Storage** | Google Drive API v3 |
| **Job Tracking** | Google Sheets API v4 |
| **Scheduling** | Vercel Cron / `node-cron` / GitHub Actions |
| **Validation** | Zod |
| **Styling** | Tailwind CSS |

---

## 📁 Project Structure

```
job-automation/
├── app/
│   ├── page.tsx                      # Dashboard UI
│   └── api/
│       ├── pipeline/run/route.ts     # POST — trigger pipeline
│       ├── jobs/route.ts             # GET — paginated results
│       ├── jobs/[id]/route.ts        # GET — single job
│       ├── health/route.ts           # GET — health check
│       └── logs/route.ts             # GET — recent log lines
│
├── services/
│   ├── orchestrator.ts               # Main pipeline runner
│   ├── filter.ts                     # Rule-based job filter
│   ├── scorer.ts                     # 0–100 scoring engine
│   ├── generator.ts                  # AI resume generator
│   ├── renderer.ts                   # LaTeX → PDF compiler
│   ├── uploader.ts                   # Google Drive uploader
│   ├── logger.ts                     # Google Sheets logger
│   └── fetcher/
│       ├── index.ts                  # Aggregator (Promise.allSettled)
│       ├── BaseFetcher.ts            # Abstract base class
│       ├── LinkedIn.ts
│       ├── Naukri.ts
│       ├── Indeed.ts
│       ├── Wellfound.ts
│       └── CompanyBoards.ts          # Greenhouse + Lever APIs
│
├── models/
│   ├── RawJob.ts                     # Raw scraped job
│   ├── ScoredJob.ts                  # Job + score breakdown
│   └── JobResult.ts                  # Final result with Drive link
│
├── config/
│   ├── profiles/
│   │   ├── software_engineer.yaml
│   │   ├── frontend_developer.yaml
│   │   ├── backend_developer.yaml
│   │   └── general_developer.yaml
│   ├── targetCompanies.ts
│   └── settings.ts
│
├── prompts/
│   └── resume_generator.txt          # Master AI prompt
│
├── resumes/
│   ├── software_engineer.tex         # Base LaTeX templates
│   ├── frontend_developer.tex
│   ├── backend_developer.tex
│   └── general_developer.tex
│
└── lib/
    ├── mongodb.ts
    ├── aiClient.ts
    ├── loadProfiles.ts
    ├── notify.ts
    └── utils.ts
```

---

## ⚡ Quick Start

### Prerequisites

- Node.js v20+
- MongoDB Atlas account (free M0 tier)
- OpenAI or Anthropic API key
- Google Cloud project with Drive + Sheets APIs enabled
- `pdflatex` installed

```bash
# macOS
brew install --cask mactex

# Ubuntu
apt install texlive-full
```

### 1. Clone & Install

```bash
git clone https://github.com/Hxrshxl/jobAutomation.git
cd jobAutomation
npm install
npx playwright install chromium
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/job-automation

# AI — pick one
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Google OAuth
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REFRESH_TOKEN=...
GOOGLE_DRIVE_FOLDER_ID=...

# Google Sheets
GOOGLE_SHEETS_ID=...
GOOGLE_SHEETS_TAB_NAME=Applications

# Pipeline config
SCORE_THRESHOLD=75
MAX_JOBS_PER_PROFILE=20
PIPELINE_SECRET=your-secret-key
USE_MOCK_DATA=true
```

### 3. Add Your Base Resumes

Place your LaTeX resumes in the `resumes/` folder, then verify each compiles:

```bash
pdflatex resumes/software_engineer.tex
```

### 4. Configure Profiles

Edit `config/profiles/software_engineer.yaml`:

```yaml
name: software_engineer
keywords:
  - React
  - Node.js
  - TypeScript
  - REST API
  - MongoDB
titlePatterns:
  - software engineer
  - full stack developer
  - sde
rejectKeywords:
  - Senior
  - Lead
  - Manager
  - Architect
baseResumePath: resumes/software_engineer.tex
```

### 5. Run

```bash
npm run dev

# Trigger the pipeline
curl -X POST http://localhost:3000/api/pipeline/run \
  -H "x-api-key: your-secret-key"
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

---

## 📊 Scoring System

Only jobs scoring **≥ 75** proceed to resume generation.

| Factor | Max Points | Logic |
|--------|-----------|-------|
| **Skill Match** | 35 pts | `(keyword_hits / total_keywords) × 35` |
| **Title Relevance** | 25 pts | Exact title = 25 · partial = 15 · none = 0 |
| **Experience Alignment** | 20 pts | Fresher/0–1yr = 20 · 2 yrs = 15 · unstated = 10 |
| **Recency** | 10 pts | ≤1 day = 10 · ≤3 days = 8 · ≤7 days = 5 · older = 0 |
| **Description Quality** | 10 pts | Length >500 chars = 5 · has structured sections = +5 |

> Borderline jobs (70–79) get an optional AI validation pass and can be bumped to 75.

---

## 🔄 Automated Schedule

Runs every **12 hours** (6 AM and 6 PM) with zero manual intervention.

**Vercel (recommended)**

```json
{
  "crons": [
    { "path": "/api/pipeline/run", "schedule": "0 6,18 * * *" }
  ]
}
```

**GitHub Actions**

```yaml
on:
  schedule:
    - cron: '0 6,18 * * *'
```

---

## 🔍 API Reference

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/pipeline/run` | Trigger full pipeline (requires `x-api-key` header) |
| `GET` | `/api/jobs` | Paginated results (`?page=1&limit=50`) |
| `GET` | `/api/jobs/:id` | Single job by MongoDB `_id` |
| `GET` | `/api/health` | Health check — DB status + timestamp |
| `GET` | `/api/logs` | Last 200 lines of latest log file |

---

## 📋 Google Sheet Output

Every processed job appends a row automatically:

| Date | Profile | Job Title | Company | Job Link | Score | Resume | Applied? |
|------|---------|-----------|---------|----------|-------|--------|----------|
| 2025-01-15 | software_engineer | SDE-1 | Razorpay | [link](#) | 88 | [Drive](#) | No |

---

## 🛡️ Key Safeguards

- **No invented experience** — AI prompt strictly forbids adding skills not in your base resume
- **Deduplication** — same job is never processed twice across runs or sources
- **Graceful failures** — one broken fetcher never crashes the pipeline (`Promise.allSettled`)
- **Drive failure** — caught and logged; pipeline continues uninterrupted
- **Sheet failure** — buffered to `data/failed_logs.json` for retry
- **Concurrent run protection** — API route rejects if a run is already in progress

---

## 🗺️ Build Phases

| Phase | Days | Goal |
|-------|------|------|
| **1 — Foundation** | 1–2 | Next.js + MongoDB + mock data skeleton |
| **2 — Fetching** | 3–5 | Real scraping from all 5 sources |
| **3 — Scoring** | 6–7 | Filter rules + 0–100 scoring engine |
| **4 — Resume AI** | 8–10 | LaTeX generation + PDF rendering |
| **5 — Storage** | 11–12 | Drive upload + Sheets logging |
| **6 — Integration** | 13 | Full 4-profile run + dashboard polish |
| **7 — Automation** | 14 | Scheduler + alerts + production deploy |

---

## 🧪 Testing

```bash
# Unit tests
npx jest tests/filter.test.ts

# Type check
npx tsc --noEmit

# Production build
npm run build
```

---

## 📄 License

MIT © [Harshal Bhagat](https://github.com/Hxrshxl)

---

<div align="center">

**Built by Harshal Bhagat** — because applying to jobs manually is a full-time job nobody asked for.

⭐ Star this repo if it saves you time.

</div>
