export interface AcademyStep {
  id: string;
  label: string;
  sub: string;
  failing?: boolean;
}

export const ACADEMY_STEPS: AcademyStep[] = [
  { id: "workspace", label: "Create your workspace", sub: "Auto-completed when you signed up." },
  { id: "warehouse", label: "Connect your data warehouse", sub: "Snowflake, BigQuery, Postgres — 90s avg." },
  { id: "salesforce", label: "Connect Salesforce integration", sub: "Required for the revenue attribution model.", failing: true },
  { id: "report", label: "Build your first report", sub: "Pick a template — the wizard fills the rest." },
  { id: "invite", label: "Invite one teammate", sub: "Accounts with 2+ seats activate 3× faster." },
];