import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const C = {
  orange: "#F9452D",
  white: "#FFFFFF",
  black: "#000000",
  whiteA30: "rgba(255,255,255,0.19)",
  whiteA10: "rgba(255,255,255,0.06)",
  whiteA50: "rgba(255,255,255,0.50)",
  whiteA70: "rgba(255,255,255,0.70)",
  muted: "rgba(255,255,255,0.45)",
  green: "#22c55e",
  gold: "#eab308",
};

const FONT = '"Neue Haas Grotesk Display Pro", "Helvetica Neue", Helvetica, Arial, sans-serif';
const MONO = '"SF Mono", "Fira Code", "Cascadia Code", monospace';

// ============================================================
// TUNABLE PROPS — adjust these to taste
// ============================================================
const POST_FONT_SCALE = 1.5; // multiplier on post text size
const DEFAULT_WALL_BASE_OPACITY = 0.55; // posts before any highlighting
// max 3 highlighted posts per problem statement (controlled via `highlight` field on each post)

// ============================================================
// WALL DATA
// highlight: which problem index (0/1/2) this post lights up for, or -1 for never
// Only HIGHLIGHT_COUNT posts per index should have highlight set
// ============================================================

type Post = {
  type: "slack" | "tweet" | "reddit" | "email" | "ticket";
  text: string;
  meta: string;
  x: number;
  y: number;
  rotation: number;
  size: "sm" | "md" | "lg";
  highlight: number; // -1 = never highlighted
};

const POSTS: Post[] = [
  // Row 0 (y≈-30) — 6 posts, tighter spacing for wall coverage
  { type: "tweet", meta: "@frustrated_dev", text: "copy-pasted their code sample. TypeError on line 3.", x: 80, y: 270, rotation: -0.8, size: "md", highlight: 0 },
  { type: "reddit", meta: "r/node · u/confused", text: "their types package doesn't match their API", x: 340, y: -20, rotation: 0.5, size: "sm", highlight: -1 },
  { type: "slack", meta: "#support · Sarah K.", text: "SDK version mismatch again. v2 docs reference v1 endpoints", x: 150, y: 670, rotation: 0.6, size: "lg", highlight: 0 },
  { type: "email", meta: "From: eng@bigcorp.com", text: "Docs reference endpoints that 404", x: 1080, y: -20, rotation: 1.0, size: "md", highlight: -1 },
  { type: "reddit", meta: "r/webdev · u/help_me", text: "their getting started guide doesn't start anything", x: 1440, y: -25, rotation: -0.6, size: "sm", highlight: -1 },
  { type: "ticket", meta: "Ticket #5102 · Med", text: "Customer can't find batch operations in docs", x: 1680, y: -20, rotation: 0.4, size: "sm", highlight: -1 },

  // Row 1 (y≈110) — 6 posts
  { type: "reddit", meta: "r/webdev · u/sdk_hater", text: "quickstart imports a package that doesn't exist. npm install fails.", x: -20, y: 105, rotation: 1.0, size: "sm", highlight: -1 },
  { type: "ticket", meta: "Ticket #4821 · High", text: "Auth flow in docs doesn't match API behavior", x: 100, y: 260, rotation: -0.4, size: "md", highlight: 1 },
  { type: "slack", meta: "#engineering · Mike T.", text: "3rd enterprise prospect churned. 'couldn't figure out auth from docs'", x: 660, y: 105, rotation: 0.3, size: "lg", highlight: -1 },
  { type: "email", meta: "From: support@acme.dev", text: "Fwd: Customer escalation — user unable to complete OAuth setup", x: 1140, y: 110, rotation: -0.8, size: "md", highlight: -1 },
  { type: "tweet", meta: "@cto_anon", text: "docs are a product. yours suck.", x: 1350, y: 280, rotation: 0.4, size: "sm", highlight: 2 },
  { type: "slack", meta: "#help · Tom B.", text: "anyone have a working example? docs ones are broken", x: 1720, y: 112, rotation: -0.5, size: "sm", highlight: -1 },

  // Row 2 (y≈245) — 5 posts
  { type: "email", meta: "From: dev@agency.io", text: "Third attempt to follow the tutorial. Still stuck on step 2.", x: -10, y: 240, rotation: -0.6, size: "sm", highlight: -1 },
  { type: "tweet", meta: "@startup_cto", text: "sidebar has 47 pages. none in logical order.", x: 1250, y: 280, rotation: 1.2, size: "md", highlight: 1 },
  { type: "slack", meta: "#dev-help · Chris L.", text: "what does 'options' do? docs say 'options: the options object'", x: 700, y: 240, rotation: -0.7, size: "lg", highlight: -1 },
  { type: "email", meta: "From: vp@startup.io", text: "Evaluating competitors with better documentation", x: 1180, y: 245, rotation: 0.5, size: "md", highlight: -1 },
  { type: "reddit", meta: "r/programming · u/tired", text: "spent a full day debugging. docs were for wrong version.", x: 1540, y: 240, rotation: -1.0, size: "md", highlight: -1 },

  // Row 3 (y≈375) — 5 posts
  { type: "slack", meta: "#product · Jess R.", text: "users ask for features we already have. can't find them in docs.", x: -10, y: 370, rotation: 0.5, size: "md", highlight: -1 },
  { type: "email", meta: "From: dev@company.com", text: "webhook docs say v1 signing but dashboard only shows v2", x: 380, y: 375, rotation: -1.0, size: "lg", highlight: -1 },
  { type: "tweet", meta: "@dx_engineer", text: "good product, mass grave of a docs site. switched to competitor.", x: 870, y: 370, rotation: 0.3, size: "md", highlight: -1 },
  { type: "ticket", meta: "Ticket #4993 · Urgent", text: "Enterprise customer threatening to cancel over docs", x: 1260, y: 375, rotation: -0.6, size: "md", highlight: -1 },
  { type: "tweet", meta: "@sdk_user", text: "deprecated without a migration path. cool docs.", x: 1620, y: 372, rotation: 0.9, size: "sm", highlight: -1 },

  // Row 4 (y≈505) — 5 posts
  { type: "tweet", meta: "@junior_eng", text: "asked ChatGPT. got better answers than their docs.", x: -10, y: 500, rotation: -1.2, size: "sm", highlight: -1 },
  { type: "ticket", meta: "Ticket #5044 · Low", text: "Code sample in 'Getting Started' throws deprecation warning", x: 1200, y: 660, rotation: 0.5, size: "md", highlight: 1 },
  { type: "slack", meta: "#support · Priya D.", text: "OAuth guide contradicts the API reference", x: 660, y: 500, rotation: -0.3, size: "md", highlight: -1 },
  { type: "email", meta: "From: ceo@prospect.co", text: "Chose competitor. Their docs got us to Hello World in 10 min.", x: 1060, y: 505, rotation: 1.0, size: "md", highlight: -1 },
  { type: "reddit", meta: "r/devops · u/infra", text: "budget 2 extra weeks onboarding. nobody can figure out docs.", x: 1440, y: 500, rotation: -0.5, size: "md", highlight: -1 },

  // Row 5 (y≈635) — 6 posts
  { type: "tweet", meta: "@eng_mgr", text: "our competitors show up in AI search. we don't.", x: -10, y: 630, rotation: 0.8, size: "sm", highlight: -1 },
  { type: "tweet", meta: "@senior_eng", text: "docs show screenshots from 2 versions ago", x: 1300, y: 290, rotation: -0.5, size: "md", highlight: 0 },
  { type: "slack", meta: "#general · Alex M.", text: "is there a webhook guide that works? current one 404s", x: 660, y: 630, rotation: 0.7, size: "md", highlight: -1 },
  { type: "email", meta: "From: success@acme.dev", text: "Internal: NPS dropped 12pts. #1 complaint = docs", x: 1060, y: 635, rotation: 0.8, size: "md", highlight: -1 },
  { type: "ticket", meta: "Ticket #5088 · Low", text: "Search returns 0 results for 'authentication'", x: 1420, y: 630, rotation: 0.3, size: "sm", highlight: -1 },
  { type: "slack", meta: "#engineering · Mike T. (2)", text: "3 more support tickets about the same auth page", x: 1650, y: 632, rotation: -0.4, size: "sm", highlight: -1 },

  // Row 6 (y≈765) — 5 posts
  { type: "tweet", meta: "@devrel_skeptic", text: "if your docs need a tutorial to understand the docs, you've lost", x: -20, y: 760, rotation: -0.6, size: "lg", highlight: -1 },
  { type: "ticket", meta: "Ticket #5200 · High", text: "SDK v2 migration guide is incomplete", x: 500, y: 765, rotation: -0.4, size: "md", highlight: -1 },
  { type: "tweet", meta: "@api_critic", text: "their changelog links to pages that don't exist anymore", x: 900, y: 760, rotation: 0.5, size: "sm", highlight: -1 },
  { type: "reddit", meta: "r/ExperiencedDevs", text: "documentation is a feature. treat it like one.", x: 80, y: 680, rotation: 0.6, size: "sm", highlight: 2 },
  { type: "email", meta: "From: pm@partner.co", text: "Integration timeline pushed 3 weeks due to docs", x: 1460, y: 760, rotation: 0.3, size: "md", highlight: -1 },

  // Row 7 (y≈895) — 5 posts
  { type: "slack", meta: "#eng · Dana F.", text: "new hire spent 3 days on something that takes 10 min with good docs", x: -20, y: 890, rotation: 0.9, size: "lg", highlight: -1 },
  { type: "ticket", meta: "Ticket #5310 · Med", text: "Rate limit docs say 100/min, actual limit is 60/min", x: 500, y: 895, rotation: -0.6, size: "md", highlight: -1 },
  { type: "email", meta: "From: pm@partner.co (2)", text: "Can you update the webhook docs? Partner blocked.", x: 900, y: 890, rotation: 0.4, size: "md", highlight: -1 },
  { type: "tweet", meta: "@anon_swe", text: "the API is fine. the docs are a war crime.", x: 1250, y: 660, rotation: -0.8, size: "sm", highlight: 2 },
  { type: "reddit", meta: "r/webdev · u/done", text: "switched providers. their docs actually work.", x: 1560, y: 892, rotation: 0.5, size: "md", highlight: -1 },
];

// Precompute entrance order: sort by y so posts load top-to-bottom
const ENTRANCE_ORDER = POSTS.map((p, i) => ({ i, y: p.y }))
  .sort((a, b) => a.y - b.y)
  .reduce<number[]>((acc, { i }, rank) => { acc[i] = rank; return acc; }, []);

const PROBLEM_LINES = [
  "Your docs are falling behind your product.",
  "Support tickets are eating your head.",
  "You're invisible on AI overviews.",
];


// ============================================================
// EDITOR CURSORS — for "humans in the loop" slide
// ============================================================
const EDITORS = [
  { name: "Naman", color: "#3b82f6" },
  { name: "Shreyans", color: "#8b5cf6" },
  { name: "Ritik", color: "#ec4899" },
  { name: "Kunal", color: "#f59e0b" },
  { name: "Adam", color: "#10b981" },
  { name: "Souptik", color: "#06b6d4" },
];

// Each cursor has a unique wandering path defined as keyframes [frame_offset, x, y]
// They move around the edges of the slide as if reviewing
const CURSOR_PATHS: [number, number, number][][] = [
  [[0, 120, 80], [30, 180, 150], [60, 250, 90], [90, 320, 180], [120, 200, 120]],
  [[0, 1700, 100], [25, 1620, 200], [55, 1750, 280], [85, 1650, 150], [120, 1720, 250]],
  [[0, 100, 850], [35, 200, 780], [65, 150, 900], [95, 280, 830], [120, 180, 870]],
  [[0, 1650, 800], [28, 1720, 880], [58, 1600, 820], [90, 1700, 900], [120, 1650, 850]],
  [[0, 800, 60], [40, 900, 120], [75, 1050, 80], [100, 950, 150], [120, 870, 90]],
  [[0, 600, 900], [32, 700, 840], [60, 550, 880], [95, 680, 920], [120, 620, 860]],
];

// Placeholder shiny text bars — scattered around edges like a doc being reviewed
const TEXT_BARS = [
  { x: 60, y: 100, w: 280, lines: 4 },
  { x: 60, y: 320, w: 220, lines: 3 },
  { x: 60, y: 780, w: 300, lines: 5 },
  { x: 1540, y: 100, w: 320, lines: 4 },
  { x: 1540, y: 350, w: 260, lines: 3 },
  { x: 1540, y: 800, w: 280, lines: 4 },
  { x: 700, y: 50, w: 240, lines: 2 },
  { x: 750, y: 920, w: 300, lines: 3 },
];

// ============================================================
// COMPONENTS
// ============================================================

const CornerMarkers: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <>
    {[{ top: 16, left: 16 }, { top: 16, right: 16 }, { bottom: 16, left: 16 }, { bottom: 16, right: 16 }].map((pos, i) => (
      <div key={i} style={{ position: "absolute", width: 8, height: 8, backgroundColor: C.orange, opacity, ...pos }} />
    ))}
  </>
);

const ManiculeLogo: React.FC<{ size?: number; color?: string }> = ({ size = 48, color = C.white }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M8 36L8 12L24 24L8 36Z" fill={color} opacity={0.5} />
    <path d="M20 36L20 12L36 24L20 36Z" fill={color} />
  </svg>
);

const EditorCursor: React.FC<{ name: string; color: string; x: number; y: number; opacity: number; scale?: number }> = ({ name, color, x, y, opacity, scale = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity, pointerEvents: "none", zIndex: 50, transform: `scale(${scale})`, transformOrigin: "top left" }}>
    <svg width="20" height="26" viewBox="0 0 16 20" fill="none"><path d="M0 0L16 12L8 12L12 20L8 18L4 12L0 16V0Z" fill={color} /></svg>
    <div style={{ position: "absolute", left: 18, top: 18, backgroundColor: color, color: "white", fontSize: 13, fontWeight: 600, padding: "3px 10px", borderRadius: 5, whiteSpace: "nowrap", fontFamily: MONO }}>{name}</div>
  </div>
);

const PlaceholderTextBlock: React.FC<{ x: number; y: number; w: number; lines: number; opacity: number }> = ({ x, y, w, lines, opacity }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity, display: "flex", flexDirection: "column", gap: 6 }}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} style={{
        width: i === lines - 1 ? w * 0.6 : w - (((i * 17 + 7) % 40)),
        height: 8,
        borderRadius: 4,
        background: `linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 100%)`,
      }} />
    ))}
  </div>
);

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const baseFs = post.size === "sm" ? 12 : post.size === "md" ? 14 : 16;
  const fs = Math.round(baseFs * POST_FONT_SCALE);
  const metaFs = Math.round((baseFs - 2) * POST_FONT_SCALE);
  const w = post.size === "sm" ? 280 : post.size === "md" ? 380 : 500;
  const pad = `${Math.round(10 * POST_FONT_SCALE)}px ${Math.round(14 * POST_FONT_SCALE)}px`;

  if (post.type === "slack") return (
    <div style={{ backgroundColor: "#1a1d21", borderRadius: 10, padding: pad, width: w, border: "1px solid #2e3138", fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: Math.round(4 * POST_FONT_SCALE) }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "#4A154B" }} />
        <span style={{ fontSize: metaFs, color: "#9ea3a8", fontWeight: 500 }}>{post.meta}</span>
      </div>
      <div style={{ fontSize: fs, color: "#d1d5db", lineHeight: 1.4 }}>{post.text}</div>
    </div>
  );

  if (post.type === "tweet") return (
    <div style={{ backgroundColor: "#15202b", borderRadius: 16, padding: pad, width: w, border: "1px solid #2f3336", fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: Math.round(4 * POST_FONT_SCALE) }}>
        <div style={{ width: Math.round(16 * POST_FONT_SCALE), height: Math.round(16 * POST_FONT_SCALE), borderRadius: "50%", backgroundColor: "#2f3336", flexShrink: 0 }} />
        <span style={{ fontSize: metaFs, fontWeight: 700, color: "#e7e9ea" }}>{post.meta.replace("@", "")}</span>
        <span style={{ fontSize: metaFs - 2, color: "#71767b" }}>{post.meta} · 2h</span>
      </div>
      <div style={{ fontSize: fs, color: "#e7e9ea", lineHeight: 1.4 }}>{post.text}</div>
    </div>
  );

  if (post.type === "reddit") return (
    <div style={{ backgroundColor: "#1a1a1b", borderRadius: 10, padding: pad, width: w, border: "1px solid #343536", fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: Math.round(4 * POST_FONT_SCALE) }}>
        <div style={{ width: Math.round(10 * POST_FONT_SCALE), height: Math.round(10 * POST_FONT_SCALE), borderRadius: "50%", backgroundColor: "#FF4500" }} />
        <span style={{ fontSize: metaFs - 2, color: "#818384", fontWeight: 600 }}>{post.meta}</span>
      </div>
      <div style={{ fontSize: fs, color: "#d7dadc", lineHeight: 1.4, fontWeight: 500 }}>{post.text}</div>
    </div>
  );

  if (post.type === "email") return (
    <div style={{ backgroundColor: "#1c1c1e", borderRadius: 10, padding: pad, width: w, border: "1px solid #333", fontFamily: FONT }}>
      <div style={{ fontSize: metaFs - 2, color: "#888", marginBottom: Math.round(3 * POST_FONT_SCALE), fontFamily: MONO }}>{post.meta}</div>
      <div style={{ fontSize: fs, color: "#ccc", lineHeight: 1.4, fontStyle: "italic" }}>&ldquo;{post.text}&rdquo;</div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#1a1520", borderRadius: 10, padding: pad, width: w, borderLeft: `3px solid ${C.orange}`, border: "1px solid #2a2030", fontFamily: FONT }}>
      <div style={{ fontSize: metaFs - 2, color: C.orange, fontFamily: MONO, fontWeight: 600, marginBottom: Math.round(3 * POST_FONT_SCALE) }}>{post.meta}</div>
      <div style={{ fontSize: fs, color: "#d4d0d8", lineHeight: 1.4 }}>{post.text}</div>
    </div>
  );
};

// ============================================================
// MAIN — 30s (900 frames)
// ============================================================

export const ManiculePromo: React.FC<{
  wallBaseOpacity?: number;
  scene1Dur?: number;
  scene2Dur?: number;
  scene4Dur?: number;
  introY?: number;
  taglineY?: number;
  cursorScale?: number;
}> = ({
  wallBaseOpacity = DEFAULT_WALL_BASE_OPACITY,
  scene1Dur = 225,
  scene2Dur = 120,
  scene4Dur = 250,
  introY = 300,
  taglineY = 510,
  cursorScale = 1.5,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene boundaries (computed from duration props)
  const s1End = scene1Dur;
  const s2Start = s1End;
  const s2End = s2Start + scene2Dur;
  const s4Start = s2End;
  const s4End = s4Start + scene4Dur;
  const s5Start = s4End;

  // SCENE 1
  const s1Active = frame < s1End + 5;
  const s1Fade = interpolate(frame, [s1End - 15, s1End + 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const probDur = Math.round((s1End - 70) / 3);
  const prob = [
    { start: 60, end: 60 + probDur },
    { start: 60 + probDur, end: 60 + probDur * 2 },
    { start: 60 + probDur * 2, end: s1End - 10 },
  ];
  const activeHighlight = frame < prob[0].start ? -1 : frame < prob[0].end ? 0 : frame < prob[1].end ? 1 : frame < prob[2].end ? 2 : -1;

  // SCENE 2
  const s2Active = frame >= s2Start - 5 && frame < s2End + 5;
  const s2In = interpolate(frame, [s2Start, s2Start + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s2Out = interpolate(frame, [s2End - 14, s2End], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const introSpr = spring({ frame: frame - s2Start - 3, fps, config: { damping: 12, mass: 0.7 } });
  const introTagOp = interpolate(frame, [s2Start + 35, s2Start + 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // SCENE 4 — case study (scene 3 removed)
  const s4Active = frame >= s4Start - 5 && frame < s4End + 5;
  const s4In = interpolate(frame, [s4Start, s4Start + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s4Out = interpolate(frame, [s4End - 14, s4End], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [s4Start, s4Start + 20, s4Start + 50, s4Start + 65], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const beforeSpr = spring({ frame: frame - (s4Start + 65), fps, config: { damping: 16 } });
  const ssFlip = interpolate(frame, [s4Start + 120, s4Start + 138], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const stat1Spr = spring({ frame: frame - (s4Start + 145), fps, config: { damping: 12 } });
  const stat2Spr = spring({ frame: frame - (s4Start + 163), fps, config: { damping: 12 } });

  // SCENE 5 — closing
  const s5Active = frame >= s5Start - 5;
  const humansOp = interpolate(frame, [s5Start + 10, s5Start + 25, s5Start + 63, s5Start + 75], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fastOp = interpolate(frame, [s5Start + 70, s5Start + 85, s5Start + 123, s5Start + 135], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const progFill = interpolate(frame, [s5Start + 95, s5Start + 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const ctaOp = interpolate(frame, [s5Start + 130, s5Start + 147], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const brandOp = interpolate(frame, [s5Start + 165, s5Start + 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const endFade = interpolate(frame, [882, 899], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.black, fontFamily: FONT, overflow: "hidden" }}>

      {/* ===== SCENE 1 ===== */}
      {s1Active && (
        <AbsoluteFill style={{ opacity: s1Fade }}>
          {POSTS.map((p, i) => {
            // Staggered entrance: sorted by y so posts load top-to-bottom
            const enterFrame = ENTRANCE_ORDER[i] * 1;
            const postIn = interpolate(frame, [enterFrame, enterFrame + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const postScale = interpolate(frame, [enterFrame, enterFrame + 4], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

            const isLit = activeHighlight >= 0 && p.highlight === activeHighlight;
            const op = postIn * (isLit ? 1 : wallBaseOpacity);
            // Smooth scale-up for highlighted posts during their statement
            const litScale = isLit
              ? interpolate(frame, [prob[p.highlight]?.start ?? 0, (prob[p.highlight]?.start ?? 0) + 20], [1, 1.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) })
              : 1;

            return (
              <div key={i} style={{
                position: "absolute", left: p.x, top: p.y,
                opacity: op,
                transform: `rotate(${p.rotation}deg) scale(${postScale * litScale})`,
                transformOrigin: "center",
                zIndex: isLit ? 40 : 1,
                boxShadow: isLit
                  ? `0 0 0 2px ${C.orange}, 0 8px 32px rgba(0,0,0,0.7), 0 0 40px ${C.orange}35`
                  : "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
                borderRadius: 12,
              }}>
                <PostCard post={p} />
              </div>
            );
          })}

          {PROBLEM_LINES.map((line, i) => {
            const { start, end } = prob[i];
            const zoom = interpolate(frame, [start, start + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
            const scale = interpolate(zoom, [0, 1], [1.5, 1]);
            const op = interpolate(frame, [start, start + 10, end - 12, end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}>
                <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", opacity: op }} />
                <div style={{ fontSize: 60, fontWeight: 600, color: C.white, textAlign: "center", opacity: op, transform: `scale(${scale})`, lineHeight: 1.1, maxWidth: 1300, padding: "0 100px", position: "relative", zIndex: 1, letterSpacing: -1.5 }}>{line}</div>
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* ===== SCENE 2 ===== */}
      {s2Active && (
        <AbsoluteFill style={{ opacity: Math.min(s2In, s2Out) }}>
          <Img src={staticFile("hero-bg.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: interpolate(s2In, [0, 1], [0, 1]) }} />
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.25)" }} />
          <CornerMarkers opacity={s2In} />

          {/* "Introducing" — right above the bg "Manicule" text */}
          <div style={{ position: "absolute", top: introY, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
            <div style={{ fontFamily: MONO, fontSize: 24, color: C.white, textTransform: "uppercase", letterSpacing: 8, fontWeight: 600, opacity: interpolate(introSpr, [0, 1], [0, 0.9]), transform: `scale(${interpolate(introSpr, [0, 1], [0.8, 1])})`, transformOrigin: "center" }}>Introducing</div>
          </div>

          {/* Tagline — right below the bg logo */}
          <div style={{ position: "absolute", top: taglineY, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, zIndex: 2 }}>
            <div style={{ fontSize: 36, color: C.white, textAlign: "center", maxWidth: 900, lineHeight: 1.4, opacity: introTagOp, fontWeight: 500 }}>
              A team of writers, engineers, and AI agents who<br />build, revamp, and maintain your documentation.
            </div>
            <div style={{ fontFamily: MONO, fontSize: 24, color: C.whiteA50, textTransform: "uppercase", letterSpacing: 2, textAlign: "center", opacity: introTagOp }}>
              FOR DEV TOOLS BUILT FOR SCALE.&nbsp;&nbsp;·&nbsp;&nbsp;AUDITED BY AI. STRUCTURED BY HUMANS.
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ===== SCENE 4 — Case Study ===== */}
      {s4Active && (
        <AbsoluteFill style={{ opacity: Math.min(s4In, s4Out) }}>
          <CornerMarkers opacity={s4In} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: titleOp }}>
            <div style={{ fontSize: 48, fontWeight: 600, color: C.white, letterSpacing: -2 }}>Here&apos;s what we did for <span style={{ color: C.orange }}>[ Supermemory ]</span></div>
          </div>
          {frame >= s4Start + 65 && (
            <div style={{ position: "absolute", top: 30, left: 40, right: 40, opacity: beforeSpr, transform: `translateY(${interpolate(beforeSpr, [0, 1], [25, 0])}px)` }}>
              {/* Labels — before fades out, after fades in */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.orange, textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, opacity: interpolate(ssFlip, [0, 0.3], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>[ BEFORE ]  —  SEPTEMBER</div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.green, textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, opacity: interpolate(ssFlip, [0.7, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>[ AFTER ]  —  OCTOBER  (WITH MANICULE)</div>
              </div>
              {/* Screenshots — horizontal wipe reveal */}
              <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.whiteA10}` }}>
                {/* Before — always visible underneath */}
                <Img src={staticFile("before.png")} style={{ width: "100%", height: "auto", display: "block" }} />
                {/* After — clips in from right via inset */}
                <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - ssFlip) * 100}% 0 0)` }}>
                  <Img src={staticFile("after.png")} style={{ width: "100%", height: "auto", display: "block" }} />
                </div>
                {/* Wipe edge line */}
                {ssFlip > 0.01 && ssFlip < 0.99 && (
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: `${ssFlip * 100}%`, width: 3, backgroundColor: C.orange, boxShadow: `0 0 12px ${C.orange}`, zIndex: 2 }} />
                )}
              </div>
              <div style={{ height: 6, backgroundColor: ssFlip < 0.5 ? C.orange : C.green, borderRadius: "0 0 10px 10px", marginTop: -1, transition: "background-color 0.3s" }} />
            </div>
          )}
          {frame >= s4Start + 145 && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.85)", padding: "30px 0 40px", display: "flex", justifyContent: "center", gap: 80 }}>
              <div style={{ opacity: stat1Spr, transform: `translateY(${interpolate(stat1Spr, [0, 1], [20, 0])}px)`, textAlign: "center" }}>
                <div style={{ fontFamily: MONO, fontSize: 22, color: C.orange, textTransform: "uppercase", letterSpacing: 4, marginBottom: 10 }}>SUCCESS RATE</div>
                <div style={{ fontSize: 80, fontWeight: 600, color: C.white, letterSpacing: -2 }}>62% <span style={{ color: C.orange }}>→</span> 89%</div>
              </div>
              <div style={{ width: 1, backgroundColor: C.whiteA30, alignSelf: "stretch" }} />
              <div style={{ opacity: stat2Spr, transform: `translateY(${interpolate(stat2Spr, [0, 1], [20, 0])}px)`, textAlign: "center" }}>
                <div style={{ fontFamily: MONO, fontSize: 22, color: C.orange, textTransform: "uppercase", letterSpacing: 4, marginBottom: 10 }}>NEW DEALS</div>
                <div style={{ fontSize: 80, fontWeight: 600, color: C.gold, letterSpacing: -2 }}>$100K+</div>
              </div>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* ===== SCENE 5 ===== */}
      {s5Active && (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: endFade }}>
          <CornerMarkers />
          <div style={{ position: "absolute", inset: 0, opacity: humansOp }}>
            {/* Placeholder text blocks — shimmering bars around edges */}
            {TEXT_BARS.map((bar, i) => (
              <PlaceholderTextBlock key={i} x={bar.x} y={bar.y} w={bar.w} lines={bar.lines} opacity={humansOp * 0.5} />
            ))}
            {/* Editor cursors — wandering around the edges */}
            {EDITORS.map((editor, i) => {
              const path = CURSOR_PATHS[i];
              const rel = frame - s5Start - 10;
              const xs = path.map(p => p[1]);
              const ys = path.map(p => p[2]);
              const ts = path.map(p => p[0]);
              const cx = interpolate(rel, ts, xs, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const cy = interpolate(rel, ts, ys, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const cursorOp = interpolate(rel, [i * 3, i * 3 + 8, 58, 65], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return <EditorCursor key={editor.name} name={editor.name} color={editor.color} x={cx} y={cy} opacity={cursorOp * humansOp} scale={cursorScale} />;
            })}
            {/* Center text */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ maxWidth: 1100, textAlign: "center" }}>
                <div style={{ fontSize: 52, fontWeight: 600, color: C.white, lineHeight: 1.15, letterSpacing: -2 }}>humans in the loop.<br />because docs shouldn&apos;t sound<br />like <span style={{ color: C.orange }}>AI-generated bullshit.</span></div>
              </div>
            </div>
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: fastOp, overflow: "hidden" }}>
            {/* Speed lines — horizontal streaks shooting across */}
            {[
              { y: 280, h: 2, delay: 0, dur: 8, color: C.orange },
              { y: 420, h: 3, delay: 3, dur: 6, color: C.orange },
              { y: 620, h: 2, delay: 5, dur: 7, color: C.orange },
              { y: 180, h: 1, delay: 2, dur: 10, color: C.whiteA30 },
              { y: 750, h: 1, delay: 7, dur: 9, color: C.whiteA30 },
              { y: 350, h: 2, delay: 10, dur: 6, color: C.whiteA30 },
              { y: 500, h: 1, delay: 4, dur: 8, color: C.whiteA30 },
              { y: 880, h: 2, delay: 8, dur: 7, color: C.orange },
              { y: 100, h: 1, delay: 12, dur: 6, color: C.whiteA30 },
              { y: 560, h: 3, delay: 6, dur: 5, color: C.orange },
            ].map((line, i) => {
              const rel = frame - (s5Start + 75);
              const lineStart = line.delay;
              const lineX = interpolate(rel, [lineStart, lineStart + line.dur], [-400, 2400], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
              const lineOp = interpolate(rel, [lineStart, lineStart + 2, lineStart + line.dur - 2, lineStart + line.dur], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return <div key={i} style={{ position: "absolute", top: line.y, left: lineX, width: 300 + line.dur * 20, height: line.h, backgroundColor: line.color, opacity: lineOp, borderRadius: line.h, boxShadow: line.color === C.orange ? `0 0 8px ${C.orange}60` : "none" }} />;
            })}
            {/* Center text */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
              <div style={{ fontSize: 56, fontWeight: 600, color: C.white, letterSpacing: -2, transform: `translateX(${interpolate(frame, [s5Start + 70, s5Start + 80], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) })}px)` }}>and we&apos;re still the fastest.</div>
              <div style={{ fontFamily: MONO, fontSize: 14, color: C.whiteA70, textTransform: "uppercase", letterSpacing: 3, opacity: interpolate(frame, [s5Start + 110, s5Start + 118], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>AI AGENTS HANDLE THE SCALE. HUMANS HANDLE THE THINKING.</div>
            </div>
          </div>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20, opacity: ctaOp }}>
            <div style={{ fontSize: 48, fontWeight: 600, color: C.whiteA70, letterSpacing: -1 }}>sounds too good to be true?</div>
            <div style={{ fontSize: 60, fontWeight: 600, color: C.orange, letterSpacing: -2, transform: `scale(${interpolate(ctaOp, [0, 1], [0.95, 1])})` }}>book a call and find out.</div>
            <div style={{ marginTop: 32, opacity: brandOp }}>
              <div style={{ fontFamily: MONO, fontSize: 28, color: C.whiteA70, letterSpacing: 3 }}>manicule.dev</div>
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
