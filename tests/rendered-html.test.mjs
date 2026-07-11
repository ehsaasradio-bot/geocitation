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

test("server-renders the Signal observatory", async () => {
  const worker = await loadWorker("page");
  const response = await worker.fetch(new Request("http://localhost/", {
    headers: { accept: "text/html" },
  }), env, ctx);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /SIGNAL°/);
  assert.match(html, /AI<\/span><span>SIGNAL/);
  assert.match(html, /SEE WHAT AI CAN FIND\. FIX WHAT IT CAN’T\./);
  assert.match(html, />Test Now</);
  assert.match(html, />How It Works</);
  assert.match(html, /Your website exists/);
  assert.match(html, /Reveal my footprint/);
  assert.match(html, /LIVE SIGNAL MAP/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
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
    assert.equal(result.methodology.includes("does not claim"), true);
    assert.equal(Array.isArray(result.findings), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
