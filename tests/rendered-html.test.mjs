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

class MockSandboxDb {
  orders = [];
  entitlements = new Map();

  prepare(sql) {
    let values = [];
    const db = this;
    const statement = {
      bind(...nextValues) {
        values = nextValues;
        return statement;
      },
      async first() {
        if (sql.includes("FROM sandbox_entitlements WHERE owner_key")) {
          const owner = String(values[0]);
          return db.entitlements.get(owner) ?? null;
        }
        if (sql.includes("FROM sandbox_orders WHERE owner_key = ? AND id = ?")) {
          const owner = String(values[0]);
          const id = String(values[1]);
          return db.orders.find((order) => order.ownerKey === owner && order.id === id) ?? null;
        }
        return null;
      },
      async all() {
        if (!sql.includes("FROM sandbox_orders WHERE owner_key")) return { results: [] };
        const owner = String(values[0]);
        const results = db.orders
          .filter((order) => order.ownerKey === owner)
          .sort((left, right) => right.createdAt - left.createdAt)
          .map(({ ownerKey, ...order }) => order);
        return { results };
      },
      async run() {
        if (sql.includes("INSERT INTO sandbox_orders")) {
          const [id, ownerKey, reference, plan, reportId, entitlementKey, amountCents, createdAt, updatedAt] = values;
          db.orders.push({
            id,
            ownerKey,
            reference,
            plan,
            reportId,
            entitlementKey,
            amountCents,
            currency: "USD",
            status: "created",
            statusDetail: "Awaiting sandbox confirmation.",
            createdAt,
            updatedAt,
            fulfilledAt: null,
          });
          return { success: true };
        }
        if (sql.includes("SET status = 'processing'")) {
          const [updatedAt, ownerKey, id] = values;
          const order = db.orders.find((item) => item.ownerKey === ownerKey && item.id === id);
          if (order) {
            order.status = "processing";
            order.statusDetail = "Simulating authorization and entitlement delivery.";
            order.updatedAt = updatedAt;
          }
          return { success: true };
        }
        if (sql.includes("SET status = 'test_paid'")) {
          const [statusDetail, updatedAt, fulfilledAt, ownerKey, id] = values;
          const order = db.orders.find((item) => item.ownerKey === ownerKey && item.id === id);
          if (order) {
            order.status = "test_paid";
            order.statusDetail = statusDetail;
            order.updatedAt = updatedAt;
            order.fulfilledAt = fulfilledAt;
          }
          return { success: true };
        }
        if (sql.includes("INSERT INTO sandbox_entitlements")) {
          const [ownerKey, fullAudit, consultation, updatedAt] = values;
          const current = db.entitlements.get(String(ownerKey)) ?? { fullAudit: 0, consultation: 0, updatedAt: 0 };
          db.entitlements.set(String(ownerKey), {
            fullAudit: Math.max(current.fullAudit, Number(fullAudit)),
            consultation: Math.max(current.consultation, Number(consultation)),
            updatedAt,
          });
          return { success: true };
        }
        return { success: true };
      },
    };
    return statement;
  }

  async batch(statements) {
    for (const statement of statements) {
      await statement.run();
    }
    return { success: true };
  }
}

class MockInquiryDb {
  inquiries = [];

  prepare(sql) {
    let values = [];
    const db = this;
    const statement = {
      bind(...nextValues) {
        values = nextValues;
        return statement;
      },
      async all() {
        if (sql.includes("FROM project_inquiries ORDER BY created_at DESC")) {
          return {
            results: [...db.inquiries].sort((left, right) => right.createdAt - left.createdAt),
          };
        }
        if (sql.includes("FROM project_inquiries WHERE owner_key = ?")) {
          const ownerKey = String(values[0]);
          return {
            results: db.inquiries
              .filter((inquiry) => inquiry.ownerKey === ownerKey)
              .sort((left, right) => right.createdAt - left.createdAt)
              .map(({ id, orderId, website, market, services, status, priority, reviewedAt, createdAt, updatedAt }) => ({
                id,
                orderId,
                website,
                market,
                services,
                status,
                priority,
                reviewedAt,
                createdAt,
                updatedAt,
              })),
          };
        }
        return { results: [] };
      },
      async run() {
        if (sql.includes("INSERT INTO project_inquiries")) {
          const [id, ownerKey, orderId, name, email, website, market, services, notes, createdAt, updatedAt] = values;
          db.inquiries.push({
            id,
            ownerKey,
            orderId,
            name,
            email,
            website,
            market,
            services,
            notes,
            createdAt,
            updatedAt,
            reviewedAt: null,
            reviewerEmail: null,
            status: "new",
            priority: "standard",
            adminNote: "",
          });
        }
        if (sql.includes("UPDATE project_inquiries")) {
          const [status, priority, adminNote, reviewerEmail, reviewedAt, updatedAt, id] = values;
          const inquiry = db.inquiries.find((item) => item.id === id);
          if (inquiry) {
            inquiry.status = status;
            inquiry.priority = priority;
            inquiry.adminNote = adminNote;
            inquiry.reviewerEmail = reviewerEmail;
            inquiry.reviewedAt = reviewedAt;
            inquiry.updatedAt = updatedAt;
            return { success: true, meta: { changes: 1 } };
          }
          return { success: true, meta: { changes: 0 } };
        }
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

test("creates, confirms, and exposes sandbox orders for signed-in users", async () => {
  const worker = await loadWorker("sandbox-order-lifecycle");
  const sandboxEnv = { ...env, DB: new MockSandboxDb() };
  globalThis.__TEST_ENV__ = { DB: sandboxEnv.DB, RATE_LIMIT_SALT: "test-salt" };
  const headers = { "content-type": "application/json", "oai-authenticated-user-email": "owner@example.com" };
  try {
    const created = await worker.fetch(new Request("http://localhost/api/billing/sandbox-checkout/", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "create", plan: "full-audit", reportId: "a".repeat(32) }),
    }), sandboxEnv, ctx);
    assert.equal(created.status, 201);
    const createdPayload = await created.json();
    assert.equal(createdPayload.order.status, "created");
    assert.equal(createdPayload.order.reportId, "a".repeat(32));
    assert.match(createdPayload.order.reference, /^sndb_[a-z0-9]{12}$/i);

    const completed = await worker.fetch(new Request("http://localhost/api/billing/sandbox-checkout/", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "complete", orderId: createdPayload.order.id }),
    }), sandboxEnv, ctx);
    assert.equal(completed.status, 200);
    const completedPayload = await completed.json();
    assert.equal(completedPayload.order.status, "test_paid");
    assert.equal(completedPayload.order.entitlementKey, "full_audit");

    const status = await worker.fetch(new Request("http://localhost/api/billing/status", {
      headers: { "oai-authenticated-user-email": "owner@example.com" },
    }), sandboxEnv, ctx);
    assert.equal(status.status, 200);
    const statusPayload = await status.json();
    assert.equal(statusPayload.fullAudit, true);
    assert.equal(statusPayload.orders.length, 1);
    assert.equal(statusPayload.orders[0].status, "test_paid");
  } finally {
    delete globalThis.__TEST_ENV__;
  }
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
    ["/contact", /Open project intake/],
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

test("accepts a same-origin done-for-you project intake", async () => {
  const worker = await loadWorker("project-intake");
  const inquiryEnv = { ...env, DB: new MockInquiryDb() };
  globalThis.__TEST_ENV__ = { DB: inquiryEnv.DB, RATE_LIMIT_SALT: "test-salt" };
  try {
    const response = await worker.fetch(new Request("http://localhost/api/inquiries", {
      method: "POST",
      headers: { "content-type": "application/json", "oai-authenticated-user-email": "mubashir@example.com" },
      body: JSON.stringify({
        name: "Mubashir",
        email: "mubashir@example.com",
        website: "https://example.com",
        market: "B2B SaaS",
        services: "Audit, schema, answer-first rewrites",
        notes: "Need GEO help for product pages and docs.",
      }),
    }), inquiryEnv, ctx);

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.ok(payload.inquiry.id);

    const listed = await worker.fetch(new Request("http://localhost/api/inquiries", {
      headers: { "oai-authenticated-user-email": "mubashir@example.com" },
    }), inquiryEnv, ctx);
    assert.equal(listed.status, 200);
    const listedPayload = await listed.json();
    assert.equal(listedPayload.inquiries.length, 1);
    assert.equal(listedPayload.inquiries[0].priority, "standard");
    assert.equal("adminNote" in listedPayload.inquiries[0], false);
    assert.equal("reviewerEmail" in listedPayload.inquiries[0], false);
  } finally {
    delete globalThis.__TEST_ENV__;
  }
});

test("protects the ops inquiry queue behind admin allowlist", async () => {
  const worker = await loadWorker("ops-queue");
  const inquiryEnv = { ...env, DB: new MockInquiryDb() };
  globalThis.__TEST_ENV__ = { DB: inquiryEnv.DB, RATE_LIMIT_SALT: "test-salt", SIGNAL_ADMIN_EMAILS: "admin@example.com" };
  try {
    const denied = await worker.fetch(new Request("http://localhost/ops/inquiries", {
      headers: { accept: "text/html", "oai-authenticated-user-email": "member@example.com" },
    }), inquiryEnv, ctx);
    assert.equal(denied.status, 200);
    assert.match(await denied.text(), /SIGNAL_ADMIN_EMAILS/);

    const allowed = await worker.fetch(new Request("http://localhost/api/inquiries", {
      headers: { "oai-authenticated-user-email": "admin@example.com" },
    }), inquiryEnv, ctx);
    assert.equal(allowed.status, 200);
    const payload = await allowed.json();
    assert.equal(payload.admin, true);
  } finally {
    delete globalThis.__TEST_ENV__;
  }
});

test("allows admins to update inquiry review state", async () => {
  const worker = await loadWorker("ops-update");
  const inquiryEnv = { ...env, DB: new MockInquiryDb() };
  globalThis.__TEST_ENV__ = { DB: inquiryEnv.DB, RATE_LIMIT_SALT: "test-salt", SIGNAL_ADMIN_EMAILS: "admin@example.com" };
  try {
    const created = await worker.fetch(new Request("http://localhost/api/inquiries", {
      method: "POST",
      headers: { "content-type": "application/json", "oai-authenticated-user-email": "owner@example.com" },
      body: JSON.stringify({
        name: "Owner",
        email: "owner@example.com",
        website: "https://example.com",
        market: "Healthcare",
        services: "Schema and content updates",
        notes: "Need help with local entity visibility.",
      }),
    }), inquiryEnv, ctx);
    const createdPayload = await created.json();

    const updated = await worker.fetch(new Request(`http://localhost/api/inquiries/${createdPayload.inquiry.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "oai-authenticated-user-email": "admin@example.com" },
      body: JSON.stringify({ status: "reviewing", priority: "urgent", adminNote: "Ready for scoped outreach." }),
    }), inquiryEnv, ctx);
    assert.equal(updated.status, 200);
    const updatedPayload = await updated.json();
    assert.equal(updatedPayload.inquiry.priority, "urgent");
    assert.equal(updatedPayload.inquiry.adminNote, "Ready for scoped outreach.");

    const listed = await worker.fetch(new Request("http://localhost/api/inquiries", {
      headers: { "oai-authenticated-user-email": "admin@example.com" },
    }), inquiryEnv, ctx);
    const listedPayload = await listed.json();
    assert.equal(listedPayload.inquiries[0].status, "reviewing");
    assert.equal(listedPayload.inquiries[0].priority, "urgent");
    assert.equal(listedPayload.inquiries[0].adminNote, "Ready for scoped outreach.");
  } finally {
    delete globalThis.__TEST_ENV__;
  }
});

test("keeps sandbox checkout context on-page before sign-in", async () => {
  const worker = await loadWorker("protected-checkout");
  const response = await worker.fetch(new Request("http://localhost/checkout?plan=full-audit&report=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&next=lab", {
    headers: { accept: "text/html" },
  }), env, ctx);

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /PAYMENT REHEARSAL \/ SIGN IN REQUIRED/);
  assert.match(html, /CONTEXT PRESERVED/);
  assert.match(html, /\/signin-with-chatgpt\?return_to=%2Fcheckout%3Fplan%3Dfull-audit%26report%3Daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa%26next%3Dlab/);
});

test("keeps visibility lab report context on-page before sign-in", async () => {
  const worker = await loadWorker("protected-lab-page");
  const response = await worker.fetch(new Request("http://localhost/lab?report=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", {
    headers: { accept: "text/html" },
  }), env, ctx);

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /VISIBILITY LAB \/ SIGN IN REQUIRED/);
  assert.match(html, /bring you back to this exact report-linked lab route/i);
  assert.match(html, /\/signin-with-chatgpt\?return_to=%2Flab%3Freport%3Daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/);
});

test("protects sandbox receipt pages behind sign-in", async () => {
  const worker = await loadWorker("protected-receipt");
  const response = await worker.fetch(new Request("http://localhost/account/orders/example-order-id", {
    headers: { accept: "text/html" },
  }), env, ctx);

  assert.equal(response.status, 307);
  assert.match(response.headers.get("location") ?? "", /\/signin-with-chatgpt\?return_to=%2Faccount%2Forders%2Fexample-order-id/);
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
