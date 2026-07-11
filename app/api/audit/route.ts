export const dynamic = "force-dynamic";

const MAX_PAGE_BYTES = 900_000;
const MAX_RESOURCE_BYTES = 300_000;
const MAX_PAGES = 6;
const REQUEST_TIMEOUT_MS = 9_000;

const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Bytespider",
  "CCBot",
  "Applebot-Extended",
  "Amazonbot",
  "FacebookBot",
  "cohere-ai",
  "YouBot",
] as const;

type Tone = "good" | "warn" | "bad";

type Finding = {
  code: string;
  label: string;
  value: string;
  tone: Tone;
  evidence: string;
  action: string;
};

type FetchResult = {
  url: URL;
  status: number;
  body: string;
  contentType: string;
  durationMs: number;
};

type PageSignals = {
  url: string;
  status: number;
  title: string;
  description: string;
  canonical: string;
  lang: string;
  wordCount: number;
  h1Count: number;
  headingCount: number;
  questionHeadings: number;
  answerBlocks: number;
  statisticalBlocks: number;
  hasViewport: boolean;
  hasAuthor: boolean;
  hasDate: boolean;
  hasLists: boolean;
  hasTable: boolean;
  externalLinks: number;
  internalLinks: string[];
  schemaTypes: string[];
  hasSameAs: boolean;
  hasAboutLink: boolean;
  hasContactLink: boolean;
  hasLegalLink: boolean;
  responseMs: number;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

function cleanText(value: string) {
  return decodeEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(value: string) {
  const text = cleanText(value);
  return text ? text.split(/\s+/).length : 0;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${escapeRegex(name)}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return decodeEntities(match?.[1] ?? match?.[2] ?? match?.[3] ?? "").trim();
}

function getMeta(html: string, key: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const target = key.toLowerCase();
  for (const tag of tags) {
    const name = (getAttribute(tag, "name") || getAttribute(tag, "property")).toLowerCase();
    if (name === target) return getAttribute(tag, "content");
  }
  return "";
}

function firstTagText(html: string, tagName: string) {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return cleanText(match?.[1] ?? "");
}

function countMatches(value: string, pattern: RegExp) {
  return (value.match(pattern) ?? []).length;
}

function collectSchema(html: string) {
  const types = new Set<string>();
  let hasSameAs = false;
  const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    const rawType = record["@type"];
    if (typeof rawType === "string") types.add(rawType);
    if (Array.isArray(rawType)) rawType.filter((item): item is string => typeof item === "string").forEach((item) => types.add(item));
    if (Array.isArray(record.sameAs) && record.sameAs.length > 0) hasSameAs = true;
    Object.values(record).forEach(visit);
  };

  for (const script of scripts) {
    const openTag = script.slice(0, script.indexOf(">") + 1);
    if (!/application\/ld\+json/i.test(getAttribute(openTag, "type"))) continue;
    const raw = script.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    if (!raw || raw.length > 300_000) continue;
    try {
      visit(JSON.parse(raw));
    } catch {
      // Malformed JSON-LD is reflected by the absence of parsed types.
    }
  }

  return { types: [...types].slice(0, 30), hasSameAs };
}

function extractLinks(html: string, base: URL) {
  const internal = new Set<string>();
  let external = 0;
  const tags = html.match(/<a\b[^>]*>/gi) ?? [];

  for (const tag of tags.slice(0, 1_200)) {
    const href = getAttribute(tag, "href");
    if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    try {
      const link = new URL(href, base);
      if (!/^https?:$/.test(link.protocol)) continue;
      if (link.origin !== base.origin) {
        external += 1;
        continue;
      }
      link.hash = "";
      link.search = "";
      if (/\.(?:pdf|jpe?g|png|gif|webp|svg|zip|mp4|mp3|woff2?|css|js|xml)$/i.test(link.pathname)) continue;
      if (/\/(?:login|logout|signin|signup|cart|checkout|admin)(?:\/|$)/i.test(link.pathname)) continue;
      internal.add(link.href.replace(/\/$/, "") || link.origin);
    } catch {
      // Ignore malformed links.
    }
  }

  return { internal: [...internal], external };
}

function analyzePage(page: FetchResult): PageSignals {
  const html = page.body;
  const title = firstTagText(html, "title");
  const description = getMeta(html, "description");
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? "";
  const canonicalTag = (html.match(/<link\b[^>]*>/gi) ?? []).find((tag) => /\bcanonical\b/i.test(getAttribute(tag, "rel")));
  const paragraphs = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) ?? [];
  const headings = html.match(/<h[1-3]\b[^>]*>[\s\S]*?<\/h[1-3]>/gi) ?? [];
  const headingTexts = headings.map(cleanText).filter(Boolean);
  const answerBlocks = paragraphs.filter((paragraph) => {
    const count = wordCount(paragraph);
    return count >= 35 && count <= 190;
  });
  const statisticalBlocks = paragraphs.filter((paragraph) => /(?:\b\d+(?:\.\d+)?%|\$\s?\d|\b\d{4}\b|\b\d+[,.]?\d*\b)/.test(cleanText(paragraph)));
  const { internal, external } = extractLinks(html, page.url);
  const schema = collectSchema(html);
  const lowerLinks = internal.map((link) => new URL(link).pathname.toLowerCase());
  const text = cleanText(html);

  return {
    url: page.url.href,
    status: page.status,
    title,
    description,
    canonical: canonicalTag ? getAttribute(canonicalTag, "href") : "",
    lang: getAttribute(htmlTag, "lang"),
    wordCount: wordCount(html),
    h1Count: countMatches(html, /<h1\b/gi),
    headingCount: headings.length,
    questionHeadings: headingTexts.filter((heading) => /\?$|^(?:who|what|when|where|why|how|can|does|is|are|should)\b/i.test(heading)).length,
    answerBlocks: answerBlocks.length,
    statisticalBlocks: statisticalBlocks.length,
    hasViewport: Boolean(getMeta(html, "viewport")),
    hasAuthor: Boolean(getMeta(html, "author")) || /\b(?:author|written by|reviewed by)\b/i.test(text),
    hasDate: Boolean(getMeta(html, "article:published_time") || getMeta(html, "article:modified_time")) || /<time\b/i.test(html),
    hasLists: /<(?:ul|ol)\b/i.test(html),
    hasTable: /<table\b/i.test(html),
    externalLinks: external,
    internalLinks: internal,
    schemaTypes: schema.types,
    hasSameAs: schema.hasSameAs,
    hasAboutLink: lowerLinks.some((path) => /\/(?:about|company|team)(?:\/|$)/.test(path)),
    hasContactLink: lowerLinks.some((path) => /\/(?:contact|support)(?:\/|$)/.test(path)),
    hasLegalLink: lowerLinks.some((path) => /\/(?:privacy|terms|legal)(?:\/|$)/.test(path)),
    responseMs: page.durationMs,
  };
}

function isPrivateIpv4(hostname: string) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return false;
  const parts = hostname.split(".").map(Number);
  if (parts.some((part) => part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function validatePublicUrl(url: URL) {
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only public HTTP and HTTPS websites can be audited.");
  if (url.username || url.password) throw new Error("Website URLs cannot contain credentials.");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("Only standard website ports can be audited.");

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname.length > 253) throw new Error("Enter a valid public website address.");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".home") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".test") ||
    hostname.endsWith(".invalid") ||
    hostname === "metadata.google.internal" ||
    hostname.includes(":") ||
    /^\d+$/.test(hostname) ||
    /^0x/i.test(hostname) ||
    isPrivateIpv4(hostname)
  ) {
    throw new Error("Private and local network addresses cannot be audited.");
  }
}

function normalizeTarget(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2_048) throw new Error("Enter a website address to begin.");
  const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  url.hash = "";
  validatePublicUrl(url);
  return url;
}

async function readLimitedBody(response: Response, limit: number) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > limit) {
      await reader.cancel();
      break;
    }
    output += decoder.decode(value, { stream: true });
  }

  return output + decoder.decode();
}

async function fetchPublic(url: URL, byteLimit = MAX_PAGE_BYTES, auditSignal?: AbortSignal): Promise<FetchResult> {
  let current = new URL(url);
  const started = Date.now();

  for (let redirects = 0; redirects <= 3; redirects += 1) {
    validatePublicUrl(current);
    const controller = new AbortController();
    const abortFromAudit = () => controller.abort(auditSignal?.reason);
    if (auditSignal?.aborted) controller.abort(auditSignal.reason);
    else auditSignal?.addEventListener("abort", abortFromAudit, { once: true });
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.2",
          "User-Agent": "SignalObservatory/1.0 (+https://signal-observatory.syedmubashirhaq.chatgpt.site)",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location) throw new Error("The website returned an invalid redirect.");
        current = new URL(location, current);
        continue;
      }

      const body = await readLimitedBody(response, byteLimit);
      return {
        url: current,
        status: response.status,
        body,
        contentType: response.headers.get("content-type") ?? "",
        durationMs: Date.now() - started,
      };
    } finally {
      clearTimeout(timeout);
      auditSignal?.removeEventListener("abort", abortFromAudit);
    }
  }

  throw new Error("The website redirected too many times.");
}

function parseRobots(robots: string) {
  const groups = new Map<string, { allow: string[]; disallow: string[] }>();
  let agents: string[] = [];
  let sawRule = false;

  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) {
      agents = [];
      sawRule = false;
      continue;
    }
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      if (sawRule) agents = [];
      agents.push(value.toLowerCase());
      sawRule = false;
      continue;
    }
    if ((key === "allow" || key === "disallow") && agents.length) {
      sawRule = true;
      for (const agent of agents) {
        const rules = groups.get(agent) ?? { allow: [], disallow: [] };
        rules[key].push(value);
        groups.set(agent, rules);
      }
    }
  }

  const access = AI_CRAWLERS.map((name) => {
    const exact = groups.get(name.toLowerCase());
    const fallback = groups.get("*");
    const rules = exact ?? fallback;
    if (!rules) return { name, allowed: true, reason: "No blocking rule" };
    const blocksAll = rules.disallow.some((path) => path === "/" || path === "/*");
    const allowsRoot = rules.allow.some((path) => path === "/" || path === "/*");
    return {
      name,
      allowed: !blocksAll || allowsRoot,
      reason: blocksAll && !allowsRoot ? "Disallow: /" : "Accessible",
    };
  });

  const wildcard = groups.get("*");
  const genericDisallows = (wildcard?.disallow ?? []).filter(Boolean);
  return { access, genericDisallows };
}

function isPathDisallowed(pathname: string, disallows: string[]) {
  return disallows.some((rule) => rule === "/" || (rule && pathname.startsWith(rule.replace(/\*.*$/, ""))));
}

function gradeFor(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function scoreAudit(
  target: URL,
  pages: PageSignals[],
  resources: { robots: FetchResult | null; sitemap: FetchResult | null; llms: FetchResult | null },
  crawlerAccess: ReturnType<typeof parseRobots>["access"],
  discoveredCount: number,
  durationMs: number,
) {
  const home = pages[0];
  const allTypes = new Set(pages.flatMap((page) => page.schemaTypes));
  const totalWords = pages.reduce((sum, page) => sum + page.wordCount, 0);
  const answerBlocks = pages.reduce((sum, page) => sum + page.answerBlocks, 0);
  const questionHeadings = pages.reduce((sum, page) => sum + page.questionHeadings, 0);
  const statisticalBlocks = pages.reduce((sum, page) => sum + page.statisticalBlocks, 0);
  const allowedCrawlers = crawlerAccess.filter((crawler) => crawler.allowed).length;
  const robotsExists = resources.robots?.status === 200;
  const sitemapExists = resources.sitemap?.status === 200 && /<(?:urlset|sitemapindex)\b/i.test(resources.sitemap.body);
  const llmsExists = resources.llms?.status === 200 && cleanText(resources.llms.body).length > 40;
  const hasFaqSchema = [...allTypes].some((type) => /FAQPage|Question|HowTo/i.test(type));
  const hasPrimaryEntity = [...allTypes].some((type) => /Organization|LocalBusiness|Person|Product|Service|Article|WebSite/i.test(type));
  const hasSameAs = pages.some((page) => page.hasSameAs);
  const hasAbout = pages.some((page) => page.hasAboutLink);
  const hasContact = pages.some((page) => page.hasContactLink);
  const hasLegal = pages.some((page) => page.hasLegalLink);
  const hasAuthor = pages.some((page) => page.hasAuthor);
  const hasDate = pages.some((page) => page.hasDate);
  const externalLinks = pages.reduce((sum, page) => sum + page.externalLinks, 0);
  const hasLists = pages.some((page) => page.hasLists);
  const hasTable = pages.some((page) => page.hasTable);

  let technical = 0;
  technical += target.protocol === "https:" ? 15 : 5;
  technical += home.status >= 200 && home.status < 300 ? 15 : 0;
  technical += home.title ? 10 : 0;
  technical += home.description ? 10 : 0;
  technical += home.canonical ? 8 : 0;
  technical += home.hasViewport ? 8 : 0;
  technical += home.lang ? 7 : 0;
  technical += robotsExists ? 7 : 3;
  technical += sitemapExists ? 10 : 0;
  technical += home.responseMs <= 2_500 ? 10 : home.responseMs <= 5_000 ? 5 : 0;

  let schema = 0;
  schema += allTypes.size > 0 ? 35 : 0;
  schema += Math.min(30, allTypes.size * 10);
  schema += hasPrimaryEntity ? 20 : 0;
  schema += hasFaqSchema ? 15 : 0;

  let content = 0;
  content += totalWords >= 1_200 ? 25 : totalWords >= 600 ? 18 : totalWords >= 250 ? 10 : 3;
  content += home.h1Count === 1 ? 12 : home.h1Count > 0 ? 6 : 0;
  content += home.headingCount >= 6 ? 12 : home.headingCount >= 2 ? 7 : 0;
  content += home.description ? 8 : 0;
  content += answerBlocks >= 12 ? 20 : answerBlocks >= 5 ? 13 : answerBlocks > 0 ? 6 : 0;
  content += questionHeadings >= 4 ? 10 : questionHeadings > 0 ? 5 : 0;
  content += statisticalBlocks >= 4 ? 7 : statisticalBlocks > 0 ? 3 : 0;
  content += pages.length >= 4 ? 6 : pages.length > 1 ? 3 : 0;

  let trust = 0;
  trust += hasAbout ? 15 : 0;
  trust += hasContact ? 15 : 0;
  trust += hasLegal ? 10 : 0;
  trust += hasAuthor ? 15 : 0;
  trust += hasDate ? 10 : 0;
  trust += externalLinks >= 5 ? 15 : externalLinks > 0 ? 7 : 0;
  trust += hasSameAs ? 10 : 0;
  trust += statisticalBlocks >= 3 ? 10 : statisticalBlocks > 0 ? 4 : 0;

  let aiReadiness = 0;
  aiReadiness += (allowedCrawlers / AI_CRAWLERS.length) * 35;
  aiReadiness += llmsExists ? 15 : 0;
  aiReadiness += sitemapExists ? 10 : 0;
  aiReadiness += answerBlocks >= 8 ? 15 : answerBlocks > 0 ? 7 : 0;
  aiReadiness += allTypes.size > 0 ? 15 : 0;
  aiReadiness += home.wordCount >= 150 ? 10 : 0;

  let answerability = 0;
  answerability += questionHeadings >= 4 ? 20 : questionHeadings > 0 ? 10 : 0;
  answerability += hasFaqSchema ? 20 : 0;
  answerability += answerBlocks >= 12 ? 25 : answerBlocks >= 4 ? 16 : answerBlocks > 0 ? 7 : 0;
  answerability += hasLists ? 8 : 0;
  answerability += hasTable ? 7 : 0;
  answerability += home.title && home.description ? 10 : 4;
  answerability += home.headingCount >= 4 ? 10 : home.headingCount > 0 ? 5 : 0;

  const categories = [
    { key: "aiReadiness", label: "AI readiness", score: clamp(aiReadiness) },
    { key: "content", label: "Content quality", score: clamp(content) },
    { key: "technical", label: "Technical", score: clamp(technical) },
    { key: "trust", label: "Trust signals", score: clamp(trust) },
    { key: "schema", label: "Structured data", score: clamp(schema) },
    { key: "answerability", label: "Answerability", score: clamp(answerability) },
  ];
  const byKey = Object.fromEntries(categories.map((category) => [category.key, category.score]));
  const score = clamp(
    byKey.aiReadiness * 0.25 +
    byKey.content * 0.2 +
    byKey.technical * 0.15 +
    byKey.trust * 0.15 +
    byKey.schema * 0.1 +
    byKey.answerability * 0.15,
  );

  const findings: Finding[] = [];
  const add = (finding: Finding) => findings.push(finding);

  if (allowedCrawlers < AI_CRAWLERS.length) {
    const blocked = crawlerAccess.filter((crawler) => !crawler.allowed).map((crawler) => crawler.name);
    add({ code: "CRAWL-01", label: "AI crawler access", value: `${allowedCrawlers}/${AI_CRAWLERS.length} allowed`, tone: allowedCrawlers < 8 ? "bad" : "warn", evidence: `Blocked for the homepage: ${blocked.join(", ")}.`, action: "Review the matching user-agent groups in robots.txt before changing access intentionally." });
  } else {
    add({ code: "CRAWL-01", label: "AI crawler access", value: "All allowed", tone: "good", evidence: `No homepage-blocking rule was found for ${AI_CRAWLERS.length} checked AI agents.`, action: "Keep monitoring robots.txt when deployment or security rules change." });
  }

  if (!llmsExists) add({ code: "AI-04", label: "llms.txt guidance", value: "Not detected", tone: "warn", evidence: `${target.origin}/llms.txt did not return a usable guidance file.`, action: "Publish a concise llms.txt that points models to canonical high-value pages." });
  if (!sitemapExists) add({ code: "TECH-02", label: "XML sitemap", value: "Not detected", tone: "warn", evidence: `${target.origin}/sitemap.xml was unavailable or not a valid sitemap.`, action: "Publish and reference an XML sitemap so important URLs can be discovered consistently." });
  if (allTypes.size === 0) add({ code: "SCHEMA-01", label: "Structured entities", value: "Missing", tone: "bad", evidence: "No parseable JSON-LD @type was found across the sampled pages.", action: "Add validated Organization, WebSite and page-specific JSON-LD using stable entity identifiers." });
  else if (!hasPrimaryEntity) add({ code: "SCHEMA-03", label: "Primary entity", value: "Unclear", tone: "warn", evidence: `Detected types: ${[...allTypes].slice(0, 8).join(", ")}.`, action: "Connect page schema to a clear Organization, Person, Product or Service entity." });
  else add({ code: "SCHEMA-03", label: "Primary entity", value: "Detected", tone: "good", evidence: `Detected types: ${[...allTypes].slice(0, 8).join(", ")}.`, action: "Keep identifiers and sameAs references consistent across templates." });

  if (!home.title || !home.description) add({ code: "TECH-06", label: "Search metadata", value: "Incomplete", tone: "bad", evidence: `${!home.title ? "Title is missing. " : ""}${!home.description ? "Meta description is missing." : ""}`.trim(), action: "Add a unique descriptive title and summary to the homepage." });
  if (answerBlocks < 4) add({ code: "CONTENT-14", label: "Answer extractability", value: "Weak", tone: "bad", evidence: `Only ${answerBlocks} self-contained passage${answerBlocks === 1 ? "" : "s"} between 35 and 190 words were found.`, action: "Lead key sections with direct, self-contained answers supported by specific facts." });
  else add({ code: "CONTENT-14", label: "Answer extractability", value: answerBlocks >= 12 ? "Strong" : "Developing", tone: answerBlocks >= 12 ? "good" : "warn", evidence: `${answerBlocks} potentially extractable answer passages were found.`, action: "Strengthen the best passages with sources, dates and first-party evidence." });

  if (!hasAbout || !hasContact || !hasAuthor) {
    const missing = [!hasAbout && "about page", !hasContact && "contact path", !hasAuthor && "authorship"].filter(Boolean).join(", ");
    add({ code: "TRUST-03", label: "Verifiable trust", value: "Incomplete", tone: "warn", evidence: `The sampled site lacks clear ${missing}.`, action: "Make ownership, authorship, contact details and editorial responsibility explicit." });
  }
  if (statisticalBlocks === 0) add({ code: "CONTENT-19", label: "First-party evidence", value: "Thin", tone: "warn", evidence: "No passages with measurable facts, dates or statistics were detected.", action: "Add attributable numbers, dates, benchmarks or original observations to key answers." });

  const toneOrder: Record<Tone, number> = { bad: 0, warn: 1, good: 2 };
  findings.sort((a, b) => toneOrder[a.tone] - toneOrder[b.tone]);

  const signalsChecked = 47;
  return {
    target: target.href,
    domain: target.hostname,
    score,
    grade: gradeFor(score),
    label: score >= 80 ? "Citation ready" : score >= 65 ? "Promising" : score >= 45 ? "Needs work" : "Low visibility",
    categories,
    findings: findings.slice(0, 8),
    metrics: {
      pagesDiscovered: discoveredCount,
      pagesScanned: pages.length,
      crawlersAllowed: allowedCrawlers,
      crawlerTotal: AI_CRAWLERS.length,
      entities: allTypes.size,
      answerBlocks,
      signalsChecked,
      durationMs,
    },
    pages: pages.map((page) => ({ url: page.url, status: page.status, title: page.title || "Untitled", words: page.wordCount })),
    crawlerAccess,
    methodology: "A deterministic readiness assessment based on the fetched pages and public technical resources. It does not claim that an AI platform currently cites the domain.",
    scannedAt: new Date().toISOString(),
  };
}

function userFacingError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") return "The website took too long to respond.";
  if (error instanceof TypeError) return "The website could not be reached from the audit service.";
  if (error instanceof Error) return error.message;
  return "The audit could not be completed.";
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) {
    return Response.json({ error: "Cross-origin audit requests are not allowed." }, { status: 403 });
  }

  let target: URL;
  try {
    const payload = (await request.json()) as { url?: unknown };
    if (typeof payload.url !== "string") throw new Error("Enter a website address to begin.");
    target = normalizeTarget(payload.url);
  } catch (error) {
    return Response.json({ error: userFacingError(error) }, { status: 400 });
  }

  const auditController = new AbortController();
  const abortFromRequest = () => auditController.abort(request.signal.reason);
  if (request.signal.aborted) auditController.abort(request.signal.reason);
  else request.signal.addEventListener("abort", abortFromRequest, { once: true });
  const overallTimeout = setTimeout(() => auditController.abort(), 25_000);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const started = Date.now();

      try {
        controller.enqueue(encoder.encode(": connected\n\n"));
        send("progress", { phase: 0, progress: 5, label: "Establishing secure crawl", meta: `Connecting to ${target.hostname}` });
        const homepage = await fetchPublic(target, MAX_PAGE_BYTES, auditController.signal);
        if (homepage.status < 200 || homepage.status >= 400) throw new Error(`The homepage returned HTTP ${homepage.status}.`);
        if (!/text\/html|application\/xhtml\+xml/i.test(homepage.contentType) && !/<html\b/i.test(homepage.body)) {
          throw new Error("The submitted address did not return an HTML website.");
        }
        target = homepage.url;

        const homeSignals = analyzePage(homepage);
        const discoveredLinks = homeSignals.internalLinks.filter((link) => {
          try { return new URL(link).origin === target.origin; } catch { return false; }
        });
        send("progress", { phase: 1, progress: 22, label: "Discovering site architecture", meta: `${discoveredLinks.length + 1} public URLs discovered` });

        const robotsUrl = new URL("/robots.txt", target.origin);
        const sitemapUrl = new URL("/sitemap.xml", target.origin);
        const llmsUrl = new URL("/llms.txt", target.origin);
        const [robotsSettled, sitemapSettled, llmsSettled] = await Promise.allSettled([
          fetchPublic(robotsUrl, MAX_RESOURCE_BYTES, auditController.signal),
          fetchPublic(sitemapUrl, MAX_RESOURCE_BYTES, auditController.signal),
          fetchPublic(llmsUrl, MAX_RESOURCE_BYTES, auditController.signal),
        ]);
        const robots = robotsSettled.status === "fulfilled" ? robotsSettled.value : null;
        const sitemap = sitemapSettled.status === "fulfilled" ? sitemapSettled.value : null;
        const llms = llmsSettled.status === "fulfilled" ? llmsSettled.value : null;
        const robotRules = parseRobots(robots?.status === 200 ? robots.body : "");
        const allowed = robotRules.access.filter((crawler) => crawler.allowed).length;
        send("progress", { phase: 2, progress: 39, label: "Testing AI crawler access", meta: `${allowed}/${AI_CRAWLERS.length} AI agents allowed` });

        const crawlTargets = discoveredLinks
          .filter((link) => !isPathDisallowed(new URL(link).pathname, robotRules.genericDisallows))
          .slice(0, MAX_PAGES - 1);
        const pageSettled = await Promise.allSettled(crawlTargets.map((link) => fetchPublic(new URL(link), MAX_PAGE_BYTES, auditController.signal)));
        const fetchedPages = pageSettled
          .filter((item): item is PromiseFulfilledResult<FetchResult> => item.status === "fulfilled")
          .map((item) => item.value)
          .filter((page) => page.status >= 200 && page.status < 400 && (/text\/html/i.test(page.contentType) || /<html\b/i.test(page.body)));
        const pageSignals = [homeSignals, ...fetchedPages.map(analyzePage)];
        const typeCount = new Set(pageSignals.flatMap((page) => page.schemaTypes)).size;
        send("progress", { phase: 3, progress: 57, label: "Extracting entities & schema", meta: `${typeCount} structured entity type${typeCount === 1 ? "" : "s"} mapped` });

        const answerBlocks = pageSignals.reduce((sum, page) => sum + page.answerBlocks, 0);
        send("progress", { phase: 4, progress: 72, label: "Reading answer passages", meta: `${answerBlocks} extractable blocks evaluated` });

        const discoveredFromSitemap = sitemap?.status === 200 ? countMatches(sitemap.body, /<loc\b/gi) : 0;
        const discoveredCount = Math.max(discoveredLinks.length + 1, discoveredFromSitemap, pageSignals.length);
        send("progress", { phase: 5, progress: 86, label: "Evaluating answer-engine signals", meta: `${pageSignals.length} pages sampled · 47 checks` });

        const result = scoreAudit(
          target,
          pageSignals,
          { robots, sitemap, llms },
          robotRules.access,
          discoveredCount,
          Date.now() - started,
        );
        send("progress", { phase: 6, progress: 96, label: "Assembling visibility fingerprint", meta: `${result.findings.length} evidence-backed findings ready` });
        send("result", result);
      } catch (error) {
        if (!request.signal.aborted) send("error", { message: userFacingError(error) });
      } finally {
        clearTimeout(overallTimeout);
        request.signal.removeEventListener("abort", abortFromRequest);
        try { controller.close(); } catch { /* The reader may have disconnected. */ }
      }
    },
    cancel() {
      auditController.abort();
      clearTimeout(overallTimeout);
      request.signal.removeEventListener("abort", abortFromRequest);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
