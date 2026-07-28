import type { BillDraft, SplitResult } from "@/types/bill";
import { formatCents } from "./currency";
import { getEffectiveTotalCents } from "./split-engine";

/**
 * Builds a plain-text summary suitable for copy/paste or sharing, e.g.:
 *
 *   Dinner at Hawi — $86.42
 *
 *   Andrew owes Satria $29.42
 *   Jason owes Satria $22.07
 *   Satria paid and covers $34.93
 */
export function buildSummaryText(draft: BillDraft, result: SplitResult): string {
  const totalCents = getEffectiveTotalCents(draft);
  const nameById = new Map(draft.people.map((p) => [p.id, p.name.trim() || "Unnamed"]));
  const payerName = draft.payerId ? (nameById.get(draft.payerId) ?? "Payer") : "Payer";

  const title = draft.name.trim()
    ? `${draft.name.trim()} — ${formatCents(totalCents)}`
    : formatCents(totalCents);

  const breakdownByPersonId = new Map(result.breakdowns.map((b) => [b.personId, b]));

  const lines: string[] = [];
  for (const person of draft.people) {
    if (person.id === draft.payerId) continue;
    const breakdown = breakdownByPersonId.get(person.id);
    if (!breakdown) continue;
    lines.push(`${nameById.get(person.id)} owes ${payerName} ${formatCents(breakdown.totalCents)}`);
  }

  const payerBreakdown = draft.payerId ? breakdownByPersonId.get(draft.payerId) : undefined;
  lines.push(`${payerName} paid and covers ${formatCents(payerBreakdown?.totalCents ?? 0)}`);

  return [title, "", ...lines].join("\n");
}
