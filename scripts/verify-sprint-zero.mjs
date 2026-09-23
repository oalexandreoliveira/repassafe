import { existsSync, readFileSync } from "node:fs";

const baseline = "supabase/migrations/20260806130000_sprint_zero.sql";
const workflow = "supabase/migrations/20260923000759_core_shift_flow.sql";

if (!existsSync(baseline) || !existsSync(workflow)) {
  console.error(
    "Migrations obrigatórias da fundação e do fluxo central ausentes.",
  );
  process.exit(1);
}

const migration = readFileSync(workflow, "utf8").toLowerCase();
const requiredControls = [
  "enable row level security",
  "private.process_workflow_command",
  "for update",
  "shift_agreements_immutable",
  "insert into public.audit_events",
];
const missing = requiredControls.filter(
  (control) => !migration.includes(control),
);

if (missing.length) {
  console.error(`Controles do fluxo central ausentes: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Fundação e controles do fluxo central preservados.");
