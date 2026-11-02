import type { Rule } from "./types";

export function toRule(row: any): Rule {
  return { id: row.rule_id, type: row.type, text: row.text, status: row.status, version: row.version };
}