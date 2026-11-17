// Pure classifiers for the Q5 measurements (E-9, D-016). No I/O here: the runner
// (q5-measurements.mjs) gathers the files and git heads, these functions turn them into the
// `<result>` half of a `[FIXTURE_Q5_M<n>] <claude version> <result>` line. Results never carry a
// filesystem path or account data (D-117): only refs, short shas, counts and versions.

export const MKT = "rein-plugins";
export const REPO = "Vimurai/rein-plugins";
export const REF = "stable";
export const SOURCE = "github"; // the source kind each measurement registers (Architect 2026-11-17 18:40)

// One measurement line: `[FIXTURE_Q5_M<n>] <claude version> source=<kind> <result>`. The source kind
// rides in every line so a github-source result is never read as the D-015 directory-source one.
export const formatLine = (n, version, result, source = SOURCE) => `[FIXTURE_Q5_M${n}] ${version} source=${source} ${result}`;

const short = (sha) => (typeof sha === "string" && /^[0-9a-f]{7,40}$/.test(sha) ? sha.slice(0, 7) : "unknown");

// Every key in known_marketplaces.json (or settings extraKnownMarketplaces) that points at REPO.
export function entriesForRepo(map) {
  return Object.entries(map || {}).filter(([, v]) => (v?.source?.repo || v?.repo) === REPO).map(([k]) => k);
}

// M1 — registration by start. `known` is the parsed known_marketplaces.json, `head` the
// clone's HEAD sha, `originStable` the remote's refs/heads/stable sha.
// trunkTracking is the signal rein-app reopens D-007/D-009 on: registered but HEAD ≠ origin/stable.
export function classifyM1({ known, head, originStable }) {
  const entry = known?.[MKT];
  if (!entry) return { line: "registered=false", trunkTracking: false };
  const ref = entry.source?.ref;
  const refPart = `ref=${typeof ref === "string" ? ref : "absent"}`;
  if (!head) return { line: `registered=true ${refPart} head=no-clone origin/${REF}=${short(originStable)}`, trunkTracking: false };
  const match = head === originStable;
  return {
    line: `registered=true ${refPart} head=${short(head)} origin/${REF}=${short(originStable)} ${match ? "head-match" : "HEAD_MISMATCH"}`,
    trunkTracking: !match || ref !== REF,
  };
}

// M2 — install by start across N fresh profiles. `samples` = one parsed installed_plugins.json
// (or null when the file is absent) per profile.
export function summariseM2(samples, plugin = `rein-seo@${MKT}`) {
  const hits = samples.map((s) => s?.plugins?.[plugin]?.[0]).filter(Boolean);
  const versions = [...new Set(hits.map((h) => h.version || "unknown"))].join(",") || "-";
  const shas = [...new Set(hits.map((h) => short(h.gitCommitSha)))].join(",") || "-";
  return `${plugin} installs=${hits.length}/${samples.length} version=${versions} sha=${shas}`;
}

// M4 — `marketplace add` on a profile a start already reconciled. before/after = { known, settings }.
// "Entry unchanged" compares the source and install location, not lastUpdated (a refresh may touch it).
export function classifyM4({ exit, before, after }) {
  const pick = (s) => JSON.stringify({ known: s?.known?.[MKT]?.source ?? null, settings: s?.settings?.extraKnownMarketplaces?.[MKT] ?? null });
  const unchanged = pick(before) === pick(after);
  const dupKnown = entriesForRepo(after?.known).length;
  const dupSettings = entriesForRepo(after?.settings?.extraKnownMarketplaces).length;
  const dup = dupKnown > 1 || dupSettings > 1;
  // Without a prior registration this is a first add, not an idempotence sample: say so.
  const prior = before?.known?.[MKT] ? "reconciled" : "NOT_RECONCILED";
  return {
    line: `prior=${prior} exit=${exit} entry=${unchanged ? "unchanged" : "CHANGED"} known-entries=${dupKnown} settings-entries=${dupSettings}${dup ? " DUPLICATE" : ""}`,
    ok: prior === "reconciled" && exit === 0 && unchanged && !dup,
  };
}

// M3 — GitHub-shorthand registration (E-8, D-014). The ONE assertion among the Q5 lines: after
// `claude plugin marketplace add Vimurai/rein-plugins#stable --scope user`, the written settings
// must carry the ref and the repo. `settings` is the parsed settings.json. `fail` is the named
// reason, or null when the registration is right.
export function classifyM3(settings) {
  const src = settings?.extraKnownMarketplaces?.[MKT]?.source;
  if (!src) return { line: "registered=false", fail: "[FIXTURE_SHAPE_DRIFT]" };
  const ref = typeof src.ref === "string" ? src.ref : "absent";
  const line = `ref=${ref} repo=${src.repo ?? "absent"}`;
  if (ref === "absent") return { line, fail: "[FIXTURE_REF_MISSING]" };
  if (ref !== REF || src.repo !== REPO) return { line, fail: "[FIXTURE_SHAPE_DRIFT]" };
  return { line: `${line} ok`, fail: null };
}
