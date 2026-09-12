// Words that stay lowercase in title case, unless they're the first word.
const SMALL_WORDS = new Set(["of", "the", "and", "a", "an", "in", "on", "for", "to", "with"]);

// Known terms with their canonical casing — checked before falling back
// to generic title-casing, so "sql" becomes "SQL" and "mysql" becomes
// "MySQL" rather than "Sql" / "Mysql".
const KNOWN_TERMS: Record<string, string> = {
  sql: "SQL",
  mysql: "MySQL",
  postgresql: "PostgreSQL",
  nosql: "NoSQL",
  html: "HTML",
  css: "CSS",
  api: "API",
  apis: "APIs",
  ui: "UI",
  ux: "UX",
  "ui/ux": "UI/UX",
  aws: "AWS",
  gcp: "GCP",
  seo: "SEO",
  sre: "SRE",
  hr: "HR",
  it: "IT",
  qa: "QA",
  ios: "iOS",
  macos: "macOS",
  php: "PHP",
  json: "JSON",
  xml: "XML",
  rest: "REST",
  graphql: "GraphQL",
  npm: "npm",
  devops: "DevOps",
  ci: "CI",
  cd: "CD",
  "ci/cd": "CI/CD",
  saas: "SaaS",
  paas: "PaaS",
  iaas: "IaaS",
  crm: "CRM",
  erp: "ERP",
  kpi: "KPI",
  kpis: "KPIs",
  vpn: "VPN",
  ip: "IP",
  http: "HTTP",
  https: "HTTPS",
  ssh: "SSH",
  ssl: "SSL",
  tcp: "TCP",
  udp: "UDP",
  dns: "DNS",
  cdn: "CDN",
  aiml: "AI/ML",
  ai: "AI",
  ml: "ML",
  nodejs: "Node.js",
  "node.js": "Node.js",
  reactjs: "React.js",
  vuejs: "Vue.js",
  nextjs: "Next.js",
  "next.js": "Next.js",
  typescript: "TypeScript",
  javascript: "JavaScript",
  github: "GitHub",
  gitlab: "GitLab",
  linkedin: "LinkedIn",
  phd: "PhD",
  mba: "MBA",
  ceo: "CEO",
  cto: "CTO",
  cfo: "CFO",
  coo: "COO",
};

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Normalizes free-typed terms (skills, institutions, positions, fields of
 * study) into consistent title case, with known tech acronyms/compounds
 * using their canonical casing instead of generic title-casing —
 * e.g. "sql" -> "SQL", "mysql" -> "MySQL", "python" -> "Python".
 */
export function formatTermCasing(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  // Whole-phrase match first (covers multi-word known terms like "ui/ux").
  const wholeLower = trimmed.toLowerCase();
  if (KNOWN_TERMS[wholeLower]) return KNOWN_TERMS[wholeLower];

  const words = trimmed.split(/\s+/);
  return words
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (KNOWN_TERMS[lower]) return KNOWN_TERMS[lower];
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      return capitalizeWord(word);
    })
    .join(" ");
}
