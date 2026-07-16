import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEEPDIVE_ACCESS_COOKIE,
  DEEPDIVE_ACCESS_TOKEN,
} from "../../lib/deepdive/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deep Dives — Private",
  description: "Invite-only competitor deep dives.",
  robots: { index: false, follow: false, nocache: true },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const dives = [
  {
    eyebrow: "NO. 01 · JULY 13, 2026",
    title: "Scrunch, decoded.",
    copy: "The $225M incumbent — Sitecore's GEO acquisition, 500+ enterprise brands, the AXP edge-delivery moat, and the monitoring-to-action gap every competitor is measured against.",
    tags: ["$225M exit", "30–75× ARR", "500+ brands"],
    href: "/deepdive/scrunch",
    tone: "blue",
  },
  {
    eyebrow: "NO. 02 · JULY 15, 2026",
    title: "Geoptie, decoded.",
    copy: "A content-marketing machine wearing a SaaS platform — the Tor.app factory's keyword play, the annual-÷-12 price trick, self-ranked #1 in sixteen of sixteen posts. All 59 pages read.",
    tags: ["16/16 self-ranked", "$49–199 true", "11 locales · 0 Arabic"],
    href: "/deepdive/geoptie",
    tone: "violet",
  },
  {
    eyebrow: "NO. 03 · JULY 16, 2026",
    title: "Zaher, decoded.",
    copy: "A real first mover wearing a bigger company's numbers — the direct Arabic-GEO competitor, eleven months ahead. All 29 pages read; 5·6·7 engine claims; the $7.99 hidden tier.",
    tags: ["5·6·7 engines", "90× count gap", "$7.99 hidden tier"],
    href: "/deepdive/zaher",
    tone: "green",
  },
  {
    eyebrow: "NO. 04 · RESERVED",
    title: "Next deep dive.",
    copy: "The grid keeps its two-by-two rhythm as the series grows — the next target slots in here.",
    tags: [],
    tone: "reserved",
  },
] as const;

export default async function DeepDivePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const cookieStore = await cookies();
  const unlocked =
    cookieStore.get(DEEPDIVE_ACCESS_COOKIE)?.value === DEEPDIVE_ACCESS_TOKEN;

  if (!unlocked) {
    const params = await searchParams;
    const rawKey = params.key;
    const key = typeof rawKey === "string" ? rawKey : "";
    if (key) redirect(`/api/deepdive-access?key=${encodeURIComponent(key)}`);
    return <LockedNotice />;
  }

  return (
    <main className="deepdive-page" id="main-content">
      <section className="deepdive-cover" aria-labelledby="deepdive-title">
        <p className="deepdive-kicker">PRIVATE · COMPETITOR DEEP DIVES</p>
        <h1 id="deepdive-title">Deep dives.</h1>
        <p className="deepdive-sub">
          The teardown series — every competitor site read in full, every claim
          checked against evidence. Read as designed; new dives slot into the
          grid two-by-two as they land.
        </p>
        <div className="mirqab-part-grid deepdive-grid">
          {dives.map((dive) =>
            "href" in dive && dive.href ? (
              <a
                className={`mirqab-part-card teardown-card ${dive.tone}`}
                key={dive.eyebrow}
                href={dive.href}
              >
                <span>{dive.eyebrow}</span>
                <h2>{dive.title}</h2>
                <p>{dive.copy}</p>
                {dive.tags.length ? (
                  <div className="deepdive-tags">
                    {dive.tags.map((tag) => (
                      <em key={tag}>{tag}</em>
                    ))}
                  </div>
                ) : null}
                <span className="teardown-cta">Open the deep dive →</span>
              </a>
            ) : (
              <article
                className={`mirqab-part-card teardown-card ${dive.tone}`}
                key={dive.eyebrow}
              >
                <span>{dive.eyebrow}</span>
                <h2>{dive.title}</h2>
                <p>{dive.copy}</p>
              </article>
            ),
          )}
        </div>
      </section>
    </main>
  );
}

function LockedNotice() {
  return (
    <main className="deepdive-page deepdive-locked" id="main-content">
      <section className="deepdive-lock">
        <p className="deepdive-kicker">PRIVATE · INVITE ONLY</p>
        <h1>This deep dive is opened by link.</h1>
        <p>
          Access is granted through a private invite link. Open the page with
          the full link you were given — it unlocks the deep dives on this
          device for seven days. There is nothing to type here.
        </p>
      </section>
    </main>
  );
}
