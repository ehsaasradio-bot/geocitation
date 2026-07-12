import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker(label) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${label}-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

const env = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

const ctx = {
  waitUntil() {},
  passThroughOnException() {},
};

class MockRateLimitDb {
  counts = new Map();

  prepare(sql) {
    let values = [];
    const counts = this.counts;
    const statement = {
      bind(...nextValues) {
        values = nextValues;
        return statement;
      },
      async first() {
        if (!sql.includes("INSERT INTO audit_rate_limits")) return null;
        const key = String(values[0]);
        const count = (counts.get(key) ?? 0) + 1;
        counts.set(key, count);
        return { request_count: count };
      },
      async run() {
        return { success: true };
      },
    };
    return statement;
  }
}

test("server-renders the Signal observatory", async () => {
  const worker = await loadWorker("page");
  const response = await worker.fetch(new Request("http://localhost/", {
    headers: { accept: "text/html" },
  }), env, ctx);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);

  const html = await response.text();
  assert.match(html, /SIGNAL°/);
  assert.match(html, /AI<\/span><span>SIGNAL/);
  assert.match(html, /SEE WHAT AI CAN FIND\. FIX WHAT IT CAN’T\./);
  assert.match(html, />Test Now</);
  assert.match(html, />How It Works</);
  assert.match(html, /YOUR WEBSITE EXISTS\. DOES AI KNOW IT\?/);
  assert.match(html, /Reveal my footprint/);
  assert.match(html, /HOW IT WORKS/);
  assert.match(html, /From invisible site to/);
  assert.match(html, /43 SIGNALS/);
  assert.match(html, /Test sandbox checkout/);
  assert.match(html, /My reports/);
  assert.doesNotMatch(html, /LIVE SIGNAL MAP/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps saved report data behind sign-in", async () => {
  const worker = await loadWorker("private-reports");
  const response = await worker.fetch(new Request("http://localhost/api/reports", {
    headers: { accept: "application/json" },
  }), env, ctx);

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  const payload = await response.json();
  assert.match(payload.error, /Sign in/i);
});

test("exposes sandbox status without accepting anonymous orders", async () => {
  const worker = await loadWorker("sandbox-billing");
  const status = await worker.fetch(new Request("http://localhost/api/billing/status"), env, ctx);
  assert.equal(status.status, 200);
  assert.deepEqual(await status.json(), { testMode: true, fullAudit: false, consultation: false, orders: [] });

  const checkout = await worker.fetch(new Request("http://localhost/api/billing/sandbox-checkout/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ plan: "full-audit" }),
  }), env, ctx);
  assert.equal(checkout.status, 401);
  assert.match((await checkout.json()).error, /Sign in/i);
});

test("protects the premium visibility lab API", async () => {
  const worker = await loadWorker("visibility-lab");
  const response = await worker.fetch(new Request("http://localhost/api/lab?reportId=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"), env, ctx);
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.match((await response.json()).error, /Sign in/i);

  const run = await worker.fetch(new Request("http://localhost/api/lab-run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reportId: "a".repeat(32), promptKey: "brand-knowledge", provider: "openai" }) }), env, ctx);
  assert.equal(run.status, 401);
});

test("rejects private and local audit targets before streaming", async () => {
  const worker = await loadWorker("private-target");
  const response = await worker.fetch(new Request("http://localhost/api/audit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "http://127.0.0.1/admin" }),
  }), env, ctx);

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.match(payload.error, /Private and local network addresses/i);
});

test("streams ordered live audit events and an evidence-backed result", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /\n", { status: 200, headers: { "content-type": "text/plain" } });
    }
    if (url.pathname === "/sitemap.xml") {
      return new Response("<urlset><url><loc>https://example.com/</loc></url><url><loc>https://example.com/about</loc></url></urlset>", { status: 200, headers: { "content-type": "application/xml" } });
    }
    if (url.pathname === "/llms.txt") {
      return new Response("# Example\nA useful public description for language models.\n- [About](https://example.com/about)", { status: 200, headers: { "content-type": "text/plain" } });
    }
    const html = `<!doctype html><html lang="en"><head><title>Example Research Company</title><meta name="description" content="Evidence-backed services and research."><meta name="viewport" content="width=device-width"><link rel="canonical" href="https://example.com/"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Example","sameAs":["https://www.linkedin.com/company/example"]}</script></head><body><h1>Example Research</h1><h2>How does the service work?</h2><p>Our service evaluates public evidence and gives teams a specific, measurable answer. In 2026, the process reviewed 250 documented signals across each selected page, connecting every recommendation to its source so decision makers can verify the result before acting on it.</p><ul><li>Evidence</li><li>Actions</li></ul><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a></body></html>`;
    return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
  };

  try {
    const worker = await loadWorker("stream");
    const response = await worker.fetch(new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "text/event-stream" },
      body: JSON.stringify({ url: "https://example.com" }),
    }), env, ctx);

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/event-stream/i);
    const body = await response.text();
    assert.match(body, /^: connected/m);
    assert.match(body, /event: progress/);
    assert.match(body, /event: result/);
    assert.ok(body.indexOf('"phase":0') < body.indexOf('"phase":6'));
    const resultData = body.match(/event: result\ndata: (.+)/)?.[1];
    assert.ok(resultData, "result event should contain JSON data");
    const result = JSON.parse(resultData);
    assert.equal(result.domain, "example.com");
    assert.equal(result.metrics.crawlerTotal, 14);
    assert.equal(result.metrics.crawlersMeasured, 14);
    assert.equal(result.metrics.signalsChecked, 43);
    assert.equal(result.categories.reduce((sum, category) => sum + category.weight, 0), 100);
    assert.equal(result.resources.length, 3);
    assert.equal(result.crawlerAccess.some((crawler) => crawler.purpose === "user_retrieval"), true);
    assert.equal(result.pages.some((page) => page.url.includes("/about")), true);
    assert.equal(result.methodology.includes("does not claim"), true);
    assert.equal(result.methodology.includes("source-HTML"), true);
    assert.equal(Array.isArray(result.findings), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("server-renders the full public information and report routes", async () => {
  const worker = await loadWorker("public-routes");
  const expected = new Map([
    ["/about", /We make invisible AI visibility visible/],
    ["/accessibility", /Readable signals for everyone/],
    ["/contact", /Project intake opens next phase/],
    ["/faq", /Questions answer engines would ask/],
    ["/methodology", /A score you can inspect/],
    ["/privacy", /Report storage/],
    ["/report", /ASSEMBLING EVIDENCE REPORT/],
    ["/terms", /Sandbox checkout/],
  ]);

  for (const [path, pattern] of expected) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), env, ctx);
    assert.equal(response.status, 200, `${path} should render`);
    assert.match(await response.text(), pattern);
  }
});

test("protects sandbox checkout behind sign-in even with return params", async () => {
  const worker = await loadWorker("protected-checkout");
  const response = await worker.fetch(new Request("http://localhost/checkout?plan=full-audit&report=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&next=lab", {
    headers: { accept: "text/html" },
  }), env, ctx);

  assert.equal(response.status, 307);
  assert.match(response.headers.get("location") ?? "", /\/signin-with-chatgpt\?return_to=%2Fcheckout%3Fplan%3Dfull-audit/);
});

test("reports crawler policy as unknown when robots cannot be verified", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname === "/robots.txt") return new Response("Unavailable", { status: 503, headers: { "content-type": "text/plain" } });
    if (url.pathname === "/sitemap.xml" || url.pathname === "/llms.txt") return new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } });
    return new Response("<!doctype html><html lang=\"en\"><head><title>Unknown Policy</title><meta name=\"description\" content=\"A public example website.\"><meta name=\"viewport\" content=\"width=device-width\"></head><body><h1>Unknown policy</h1><p>This public page contains enough descriptive content to complete a bounded source HTML audit while the crawler policy endpoint remains unavailable for verification by the service.</p></body></html>", { status: 200, headers: { "content-type": "text/html" } });
  };

  try {
    const worker = await loadWorker("unknown-robots");
    const response = await worker.fetch(new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "text/event-stream" },
      body: JSON.stringify({ url: "https://example.com" }),
    }), env, ctx);
    const body = await response.text();
    const resultData = body.match(/event: result\ndata: (.+)/)?.[1];
    assert.ok(resultData);
    const result = JSON.parse(resultData);
    assert.equal(result.metrics.crawlersAllowed, 0);
    assert.equal(result.metrics.crawlersMeasured, 0);
    assert.equal(result.crawlerAccess.every((crawler) => crawler.state === "unknown"), true);
    assert.equal(result.findings.some((finding) => finding.value === "Policy unknown"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects cross-origin and oversized audit requests", async () => {
  const worker = await loadWorker("request-boundaries");
  const crossOrigin = await worker.fetch(new Request("http://localhost/api/audit", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://attacker.example" },
    body: JSON.stringify({ url: "https://example.com" }),
  }), env, ctx);
  assert.equal(crossOrigin.status, 403);

  const oversized = await worker.fetch(new Request("http://localhost/api/audit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: `https://example.com/${"a".repeat(5_000)}` }),
  }), env, ctx);
  assert.equal(oversized.status, 400);
  assert.match((await oversized.json()).error, /too large/i);

  const wrongType = await worker.fetch(new Request("http://localhost/api/audit", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify({ url: "https://example.com" }),
  }), env, ctx);
  assert.equal(wrongType.status, 415);
});

test("durably limits repeated production audits without storing raw addresses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname === "/robots.txt") return new Response("User-agent: *\nAllow: /", { status: 200, headers: { "content-type": "text/plain" } });
    if (url.pathname === "/sitemap.xml") return new Response("<urlset></urlset>", { status: 200, headers: { "content-type": "application/xml" } });
    if (url.pathname === "/llms.txt") return new Response("# Example\nA public language-model guidance file for testing rate limits.", { status: 200, headers: { "content-type": "text/plain" } });
    return new Response("<!doctype html><html lang=\"en\"><head><title>Rate limit test</title><meta name=\"description\" content=\"A bounded public audit test.\"><meta name=\"viewport\" content=\"width=device-width\"></head><body><h1>Rate limit test</h1><p>This page contains enough public text to exercise the protected audit route while avoiding any dependency on a real external website during automated verification.</p></body></html>", { status: 200, headers: { "content-type": "text/html" } });
  };

  try {
    const worker = await loadWorker("rate-limit");
    const rateDb = new MockRateLimitDb();
    const protectedEnv = { ...env, DB: rateDb, RATE_LIMIT_SALT: "test-only-salt" };
    const request = () => new Request("https://signal-observatory.syedmubashirhaq.chatgpt.site/api/audit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
        origin: "https://signal-observatory.syedmubashirhaq.chatgpt.site",
        "cf-connecting-ip": "203.0.113.25",
      },
      body: JSON.stringify({ url: "https://example.com" }),
    });

    for (let index = 0; index < 5; index += 1) {
      const response = await worker.fetch(request(), protectedEnv, ctx);
      assert.equal(response.status, 200);
      await response.text();
    }

    const blocked = await worker.fetch(request(), protectedEnv, ctx);
    assert.equal(blocked.status, 429);
    assert.match((await blocked.json()).error, /free audit limit/i);
    assert.ok(Number(blocked.headers.get("retry-after")) > 0);
    assert.equal([...rateDb.counts.keys()].some((key) => key.includes("203.0.113.25")), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
