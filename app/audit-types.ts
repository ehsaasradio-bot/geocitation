export const AUDIT_STORAGE_KEY = "signal:last-audit:v1";

export type AuditTone = "good" | "warn" | "bad";

export type AuditFinding = {
  code: string;
  label: string;
  value: string;
  tone: AuditTone;
  evidence: string;
  action: string;
};

export type AuditCategory = {
  key: string;
  label: string;
  score: number;
  weight: number;
  description: string;
};

export type CrawlerAccess = {
  name: string;
  allowed: boolean | null;
  state: "allowed" | "blocked" | "unknown";
  purpose: "search_index" | "user_retrieval" | "training_control";
  scoreEligible: boolean;
  reason: string;
};

export type AuditResource = {
  key: "robots" | "sitemap" | "llms";
  label: string;
  url: string;
  status: number | null;
  detected: boolean;
  detail: string;
};

export type AuditPage = {
  url: string;
  status: number;
  title: string;
  description: string;
  words: number;
  h1Count: number;
  answerBlocks: number;
  schemaTypes: string[];
};

export type AuditResult = {
  auditVersion: string;
  target: string;
  domain: string;
  score: number;
  grade: string;
  label: string;
  categories: AuditCategory[];
  findings: AuditFinding[];
  metrics: {
    pagesDiscovered: number;
    pagesScanned: number;
    crawlersAllowed: number;
    crawlersMeasured: number;
    crawlerTotal: number;
    entities: number;
    schemaTypes: number;
    answerBlocks: number;
    signalsChecked: number;
    durationMs: number;
  };
  pages: AuditPage[];
  crawlerAccess: CrawlerAccess[];
  resources: AuditResource[];
  methodology: string;
  scannedAt: string;
};
