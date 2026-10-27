# 🌱 BrandBloom

**Grow consistently. Publish confidently.**

BrandBloom is a pre-publication brand governance tool. Bud, the AI guardian, checks content against approved brand guidelines, terminology and facts. It explains each issue, cites the rule behind it, and suggests a fix. Humans make every final decision.

**Live demo:** https://brandbloom-six.vercel.app
Team KAIRO 2.O | Codex 48 Round 2

## Try it (no login needed)
1. As **Creator**, click Sample 1, then **Review with Bud**.
2. Accept or reject findings, then **Submit for approval**.
3. Switch to **Manager**, comment, and **Approve** or **Request changes**.
4. Switch back to Creator, **Revise** and resubmit.
5. Open **Insights** and click **Load sample history**.
6. Try the **Image and accessibility check**.

## Core rule: "No source, no flag"
Every finding cites a rule from the brand kit. AI findings are dropped unless the rule ID exists and the quoted text appears in the content. Claims with no approved source are marked **Unverified** and sent to a human.

## How it works
- **Rule checks (plain code):** terminology, hype words, ALL CAPS, exclamation marks, unsupported claims, colour palette, contrast ratio, alt text.
- **AI check (Gemini):** tone and claim support using only the brand kit, with retry and a fallback model.
- **Workflow:** submit, manager approve or request changes, comments, revision history.
- **Insights:** most frequent violations and Guideline Health (rules creators often reject).

## Tech
Next.js (App Router, TypeScript, Tailwind), Gemini API, Vercel.

## Run locally

## Run locally

1. Clone the repo and install packages:

   git clone https://github.com/shreya-ssalian/brandbloom.git
   cd brandbloom
   npm install

2. Create a file called .env.local in the project root with:

   GEMINI_API_KEY=your-own-gemini-key
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_FALLBACK_MODEL=gemini-3.5-flash

3. Start the app:

   npm run dev

4. Open http://localhost:3000

Without a Gemini key the app still works. The rule-based checks run, and the AI check is skipped.