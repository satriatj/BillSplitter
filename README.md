# BillSplitter

A simple web app for splitting a bill among friends — enter a receipt, add people, split it up, and get a clean summary of who owes what.

Built with Next.js, React, and TypeScript.

## Phase 1 (done)

- **Bill entry** — add line items (name, quantity, unit price), plus tax, tip, fees, and discounts. Enter the receipt's printed subtotal/total and get warned if it doesn't match what was entered.
- **People** — add everyone splitting the bill and pick who paid.
- **Payment methods** — attach a Venmo/Zelle/PayPal/Cash App handle (or "other") to each person so the summary shows how to pay them back. This is just a label for now — see roadmap.
- **Two split modes**:
  - **Equal split** — divide the bill evenly, with the option to exclude specific people.
  - **Itemized split** — assign each item to one or more people; shared items are split automatically.
  - Cent-accurate allocation so totals always add up exactly (no missing or extra pennies).
- **Summary** — per-person breakdown of what they owe, with a one-tap "copy summary" as shareable text.
- **Autosave** — your in-progress bill is saved to the browser's local storage, so a refresh won't lose your work. (Local to one device/browser — no accounts yet.)
- Unit-tested calculation engine (Vitest) covering the split logic, currency handling, and storage.

## Roadmap

Rough order, not committed dates:

- **Actual payment links** — turn Venmo/Zelle/Google Pay from a displayed handle into a tappable request/deep link.
- **Receipt upload** — snap or upload a photo of a receipt and auto-fill items (OCR).
- **Accounts & login** — save your info and a friends list instead of re-entering people every time.
- **Roommate groups / dashboard** — a persistent group for recurring shared expenses (rent, utilities, groceries) instead of one-off bills.
- **Trips** — group multiple bills under a trip and see running totals/balances across the whole trip.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run test       # run unit tests
npm run typecheck  # TypeScript check
npm run lint        # ESLint
```

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS + Radix UI primitives (shadcn-style components)
- Vitest for unit tests
