# 🌱 BrandBloom

**Grow consistently. Publish confidently.**

BrandBloom is a pre-publication brand governance platform. Bud, the AI guardian, checks content against approved brand rules, explains each issue, cites the rule or fact behind it, and suggests a fix. Humans make every final decision.

**Live demo:** https://brandbloom-six.vercel.app (use the "Try as Creator" and "Try as Manager" buttons on the login page)
Team KAIRO 2.O | Codex 48, Round 3

## Try it (about 3 minutes)
1. Log in with **Try as Creator**. Click Sample 1 and **Review with Bud**, then submit it.
2. Log out and use **Try as Manager**. Open the **Queue** and approve it or request changes with a comment.
3. As Manager, open **Brand Roots**, paste guidelines, extract rules, and approve them. New rules are enforced in the next review.
4. Open **Guideline Health** to see rules that get sent back often, and ask Bud for clearer wording.
5. Upload a DOCX or PDF in **Document check** to get findings section by section.

## What is new in Round 3
1. **Real accounts, shared database and risk routing:** Supabase login with Creator and Manager roles, shared submissions, and a manager queue with three lanes (Escalate, Needs review, Fast lane) ordered by risk.
2. **Brand Roots and Guideline Health v2:** managers paste guidelines, Bud proposes rules, the manager approves or edits them, and approved rules are enforced in reviews. Guideline Health flags rules that are often sent back and drafts clearer wording for the manager to apply as a new version.
3. **Document review:** DOCX/PDF upload, reviewed section by section, submitted into the same approval workflow.

## Core rule: "No source, no flag"
Every finding must cite a real rule or approved fact. AI findings are dropped unless the rule exists and the quoted text appears in the content. Claims with no approved source are marked **Unverified** and sent to a human.

## How it works
- **Rule checks (code):** terminology, hype words, capitals, punctuation, claims and statistics, plus colour palette, contrast and alt text in the image check.
- **AI check (Gemini):** tone and contradictions with approved facts, limited to approved rules. If the AI is unavailable, the rule checks still run and the page says so.
- **Roles:** checked on the server for every request, not only in the page.
- **Stack:** Next.js (App Router, TypeScript), Supabase (Postgres and Auth), Gemini API, Vercel.

## Run locally
```
npm install
```
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=...
GEMINI_FALLBACK_MODEL=...
NEXT_PUBLIC_DEMO_PASSWORD=...
```
```
npm run dev
```

## Known limitations
- Images are checked (palette, contrast, alt text) but are not yet attached to submissions or routed through manager approval.
- Documents: 4 MB and about 12,000 characters at most, no scanned PDFs, and a document is revised by re-uploading.
- Gemini can be busy at peak times. The app retries and falls back, but cannot remove the limit.
- No automatic logo detection.
- Demo accounts share a password that is visible in the browser by design. They are throwaway accounts with sample data.
- The Insights tab was replaced by Guideline Health.

## AI disclosure
AI tools (Claude) helped plan and write code and documents. Gemini is the in-product model. All code was run and tested by the team. See AI_DISCLOSURE.md.