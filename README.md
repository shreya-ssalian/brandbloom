# BrandBloom 🌱

**Grow consistently. Publish confidently.**

BrandBloom is a brand-governance tool. Content goes in, it is checked against a company's approved brand guidelines, the issues come back explained with their source, and a human makes the final decision.

- **Live app:** https://brandbloom-six.vercel.app
- **Sample brand kit:** GreenLeaf Organics (a fictional plant-based snack brand)

## How to try it (no setup needed)

1. Open the live app. You start as **Creator**.
2. Click **Sample 1**, then **Review with Bud**.
3. Read the findings. Each one shows the quote, the rule it breaks, and a plain-language explanation. Use **Accept fix**, **Reject** or **Dismiss**.
4. Click **Submit for approval**. It appears under *Your submissions* as "Pending review".
5. Switch **Demo role** to **Manager**. Click **Request changes** (with a comment) or **Approve**.
6. Switch back to **Creator**, click **Revise this content**, resubmit, then approve as Manager.
7. Open **Insights** and click **Load sample history** to see the dashboard.
8. Try the **Image and accessibility check** at the bottom of the Creator page.

## What it does

**Text review**
- Checks content against the brand kit: voice rules, approved terminology, approved facts and the claims policy.
- Deterministic code checks (same result every time): unapproved terms, hype words, ALL CAPS, repeated exclamation marks, and unsupported claims or statistics such as "number one" or "10,000 happy customers".
- An AI layer (Google Gemini) adds a second opinion on tone and on facts that contradict the brand kit.
- **No source, no flag:** every finding must cite a real rule ID and quote text that exists in the content. Anything else is discarded.
- **Unverified, not guessed:** a claim or statistic with no approved source is marked *Unverified* and left for a human to decide.
- Overall status: *Healthy Growth*, *Needs Pruning* or *Needs Care*.

**Human approval workflow**
- Creator submits, Manager approves or requests changes with a comment, Creator revises and resubmits.
- Versions (v1, v2…) and a timestamped history show who did what.

**Image and accessibility check** (exact rules, no AI)
- Brand palette, text contrast ratio against the 4.5:1 standard, and alt text.

**Insights**
- A dashboard of review and approval history, with sample data to explore.

## Reliability

The AI call has a 12 second timeout and a fallback model. If the AI is slow or unavailable, the rule-based checks still run and the page shows a clear note, so the product never hangs.

## Tech stack

- Next.js (App Router) and TypeScript
- Serverless API route at `/api/review`
- Google Gemini API for the AI layer
- Deployed on Vercel from GitHub

## Project structure

```
app/
  page.tsx              Main Creator / Manager UI
  ImageCheck.tsx        Image and accessibility check
  Insights.tsx          Insights dashboard
  api/review/route.ts   Review API: code checks, then AI checks
data/
  brandkit.ts           Structured brand kit (rules, terms, facts, policies, each with an ID)
```

## Run it locally

```bash
git clone https://github.com/shreya-ssalian/brandbloom.git
cd brandbloom
npm install
```

Create a file named `.env.local` in the project root:

```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODEL=gemini-2.5-flash-lite
```

Then start the app:

```bash
npm run dev
```

Open http://localhost:3000. Without an API key the app still works, using the rule-based checks only. Never commit `.env.local`.

## Principles

- AI findings are suggestions only. A human makes every final decision.
- Findings must be traceable to a rule in the brand kit.
- When there is no approved source, the app says so instead of guessing.

## AI disclosure

See [AI_DISCLOSURE.md](./AI_DISCLOSURE.md).

## Planned next (Round 3)

1. Real accounts and a database, so Creator and Manager roles and the audit trail are saved and shared.
2. Upload your own brand guidelines and turn them into structured rules, terms and approved facts.
3. AI vision checks for logos and images, plus support for Hindi and other Indian languages.
