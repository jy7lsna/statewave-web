import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Heading } from '../components/Heading'
import { Button } from '../components/Button'
import { CodeCopyButton } from '../components/CodeCopyButton'
import { PageFaq } from '../components/PageFaq'
import { SectionNav, type NavSection } from '../components/SectionNav'
import { usePageSEO } from '../lib/seo'
import { OPENROUTER_PROXY_VERSION as VERSION } from '../lib/seo-meta'

/* Landing page for statewave-openrouter, the OpenAI-compatible proxy that
 * gives OpenRouter calls persistent memory.
 *
 * The mockups and diagrams use the `--viz-*` tokens (src/index.css) so their
 * neutrals flip with the light/dark theme while the accent purple/blue stays
 * branded in both — same convention as GroundedShopAssistantPage.
 */

const REPO_URL = 'https://github.com/smaramwbc/statewave-openrouter'

/* sw-card carries the resting elevation. The hover lift follows the /about and
 * /benchmarks LiftCard recipe, but the shadow is accent-tinted rather than
 * black: sw-card's `rgba(0,0,0,.16)` is invisible against the dark surface, so
 * in dark mode the lift had no depth cue at all. focus-within mirrors hover so
 * a card reached by keyboard gets the same affordance as one under a pointer. */
const CARD =
  'sw-card rounded-2xl border border-brand-500/20 bg-surface-1/45 ' +
  'transition-[border-color,transform,box-shadow] duration-300 ' +
  'hover:-translate-y-0.5 hover:border-brand-500/45 ' +
  'hover:shadow-[0_18px_50px_rgba(122,92,255,0.14)] ' +
  'focus-within:-translate-y-0.5 focus-within:border-brand-500/45 ' +
  'focus-within:shadow-[0_18px_50px_rgba(122,92,255,0.14)]'

const NAV_SECTIONS: readonly NavSection[] = [
  { id: 'diff', label: 'The diff' },
  { id: 'flow', label: 'Request flow' },
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'auth', label: 'Auth' },
  { id: 'config', label: 'Config' },
  { id: 'start', label: 'Quick start' },
  { id: 'page-faq', label: 'FAQ' },
]

/* ─── Page shell ─────────────────────────────────────────────────────────────
 * The page is one argument, not nine equal chapters, so the section shells
 * are not interchangeable. `tier` drives padding and heading size together,
 * which is what makes the rhythm legible while scrolling rather than only
 * when reading; `surface` alternates the ground so consecutive sections read
 * as separate slabs.
 *
 * Depth here is structural — container, rhythm, hairline, elevation — rather
 * than stacked radial glows. The source design layers two or three washes per
 * section; at real viewport sizes that reads as haze over the content instead
 * of hierarchy, and it buries the one wash that earns its place (the hero).
 */
type Tier = 'lead' | 'body' | 'close'

/* A lead band announces itself with extra space ABOVE; every band closes with
 * the same space below. Padding between two sections adds rather than
 * collapses, so giving lead bands a bigger bottom too made the boundary gaps
 * land on four different values (192/240/272/288px at desktop). Matching the
 * bottoms collapses that to two — 192px between bands, 224px before a lead
 * one — which reads as intentional rhythm instead of drift. */
const BAND_PAD: Record<Tier, string> = {
  lead: 'pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24',
  body: 'py-16 sm:py-20 lg:py-24',
  close: 'py-14 sm:py-16 lg:py-20',
}

/* Leading is set per tier, not inherited: the body default of 1.5 puts a 66px
 * gap between the two lines of a 44px lead heading, which reads as two
 * unrelated sentences. Headlines tighten as they grow. */
const HEAD_SIZE: Record<Tier, string> = {
  lead: 'text-[clamp(1.85rem,4.4vw,2.75rem)] leading-[1.1]',
  body: 'text-[clamp(1.4rem,2.9vw,1.9rem)] leading-[1.2]',
  close: 'text-[clamp(1.2rem,2.3vw,1.5rem)] leading-[1.3]',
}

/* Same cadence as /benchmarks and the homepage hero, so the page's motion
 * reads as part of the site rather than its own dialect. */
const STAGGER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
}
const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] } },
}
const STILL: Variants = { hidden: {}, show: {} }

/** One child step of a Band's stagger. */
function Rise({
  className = '',
  style,
  children,
}: {
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const reduced = useReducedMotion() ?? false
  return (
    <motion.div variants={reduced ? STILL : FADE_UP} className={className} style={style}>
      {children}
    </motion.div>
  )
}

/**
 * A full-bleed section slab. Replaces the shared <Section> on this page:
 * Section fades its whole subtree as one 40px block, which on a nine-section
 * page is the same blunt move nine times. This orchestrates its children
 * instead, so headline, prose and figure arrive in order.
 */
function Band({
  id,
  tier = 'body',
  surface = false,
  className = '',
  children,
}: {
  id: string
  tier?: Tier
  /** Raise onto the alternate ground, with hairlines top and bottom. */
  surface?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <motion.section
      id={id}
      variants={STAGGER}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      className={`relative scroll-mt-32 ${BAND_PAD[tier]} ${className}`}
      /* A surface band fades in and out of the page ground rather than sitting
         behind two hairlines. `border-y` reads as a hard rule in dark mode,
         where --theme-border is a violet-tinted line rather than a faint grey
         one, and nine of them turned the page into stacked boxes. Interpolating
         to surface-0 explicitly (not `transparent`, which fades through black)
         keeps the seam invisible in both themes. This is what the source design
         specified; the borders were my shortcut. */
      style={
        surface
          ? ({
            background:
              'linear-gradient(180deg, var(--theme-surface-0) 0%, var(--theme-surface-1) 7%, var(--theme-surface-1) 93%, var(--theme-surface-0) 100%)',
            // Scroll-shadow cover colour for any .sw-scroll-x inside this band.
            '--sw-scroll-bg': 'var(--theme-surface-1)',
          } as CSSProperties)
          : undefined
      }
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6">{children}</div>
    </motion.section>
  )
}

/** Eyebrow + heading + optional lede, sized by the band's tier. */
function BandHead({
  id,
  tier = 'body',
  eyebrow,
  children,
  lede,
}: {
  id: string
  tier?: Tier
  eyebrow: ReactNode
  children: ReactNode
  lede?: ReactNode
}) {
  // Both caps are in `ch`, which resolves against each element's OWN font-size:
  // 22ch on the heading is a headline measure at any tier, 62ch on the lede is
  // a prose measure at 16px. One shared cap on the wrapper would size both
  // against the wrapper's 16px and squeeze a 2.75rem lead heading into ~500px.
  return (
    <Rise>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading
        id={id}
        className={`mt-3 max-w-[22ch] font-heading ${HEAD_SIZE[tier]} font-semibold tracking-[-0.02em] text-theme-primary`}
      >
        {children}
      </Heading>
      {lede && <p className="mt-4 max-w-[62ch] text-theme-secondary">{lede}</p>}
    </Rise>
  )
}

/* ─── Small shared pieces ────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="section-eyebrow font-mono text-xs uppercase tracking-[0.14em] text-theme-muted">
      {children}
    </p>
  )
}

/** Inline link into the rest of the site. The page used to link nowhere at
 *  all — one self-anchor in the whole body — which left it a cul-de-sac for
 *  readers and a dead end for crawlers. Targets are chosen where the prose
 *  already raises the concept, not bolted on. */
function L({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-accent underline decoration-accent/35 underline-offset-2 transition-colors hover:decoration-accent"
    >
      {children}
    </Link>
  )
}

/** Inline code inside prose. `--viz-indigo` so it stays legible on both the
 *  light card and the dark surface, unlike a fixed violet. */
function C({ children }: { children: ReactNode }) {
  return (
    <code
      className="rounded px-1.5 py-0.5 font-mono text-[0.88em]"
      style={{ color: 'var(--viz-indigo)', background: 'var(--viz-fill)' }}
    >
      {children}
    </code>
  )
}

/** Bulleted item with a gradient dot, used in the "what happened" lists. */
function Bullet({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <li className="relative pl-[18px] text-[14.5px] leading-[1.6] text-theme-secondary">
      <span
        aria-hidden="true"
        className="absolute left-0 top-[9px] h-1.5 w-1.5 rounded-full"
        style={{
          background: muted
            ? 'var(--viz-text-3)'
            : 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))',
        }}
      />
      {children}
    </li>
  )
}

/* Syntax spans for the code panels. */
const kw = { color: 'var(--viz-code-keyword)' }
const str = { color: 'var(--viz-code-string)' }
const attr = { color: 'var(--viz-code-attr)' }
const dim = { color: 'var(--viz-code-muted)' }
const txt = { color: 'var(--viz-code-text)' }

function CodePanel({
  label,
  code,
  children,
  className = '',
  headerExtra,
  flush = false,
}: {
  label: string
  /** Plain-text source handed to the copy button. */
  code: string
  /** Syntax-highlighted rendering of the same source. */
  children: ReactNode
  className?: string
  headerExtra?: ReactNode
  /** Lines carry their own horizontal padding (highlighted panels). */
  flush?: boolean
}) {
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-2xl ${className}`}
      style={{
        background: 'var(--viz-code-bg)',
        border: '1px solid var(--viz-border)',
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5"
        style={{
          borderBottom: '1px solid var(--viz-border)',
          background: 'var(--viz-shell-header)',
        }}
      >
        <span className="font-mono text-xs" style={{ color: 'var(--viz-text-3)' }}>
          {label}
        </span>
        <div className="flex items-center gap-3">
          {headerExtra}
          <CodeCopyButton code={code} label={`Copy the ${label} snippet`} />
        </div>
      </div>
      <pre
        className={`overflow-x-auto font-mono text-[13px] leading-[1.85] ${flush ? 'py-4' : 'px-4 py-4'
          }`}
        style={txt}
      >
        {children}
      </pre>
    </div>
  )
}

function DataTable({
  headers,
  rows,
  minWidth,
}: {
  headers: readonly string[]
  rows: readonly (readonly ReactNode[])[]
  minWidth: number
}) {
  return (
    <div className={`overflow-hidden ${CARD}`}>
      <div className="sw-scroll-x overflow-x-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: `${minWidth}px` }}
        >
          <thead>
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-[18px] py-3.5 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-theme-muted"
                  style={{ borderBottom: '1px solid var(--viz-border)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr
                key={r}
                className="transition-colors duration-200 hover:bg-[var(--viz-fill)]"
              >
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className={`px-[18px] py-4 align-top ${c === 0
                      ? 'whitespace-nowrap font-mono text-[13px]'
                      : 'text-theme-secondary'
                      }`}
                    style={{
                      borderBottom:
                        r === rows.length - 1 ? undefined : '1px solid var(--viz-border)',
                      color: c === 0 ? 'var(--viz-indigo)' : undefined,
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* The hero card: one real call, answered twice.
 *
 * It is framed as a request inspector rather than a chat window, because the
 * buyer is an engineer deciding whether to route production traffic through a
 * proxy. The header carries the actual endpoint, status and wall clock; the
 * memory-enabled branch carries the bundle that produced its answer.
 *
 * The example is a returning support customer, which is the workflow Statewave
 * is actually bought for. An earlier pass asked what coffee the user drinks:
 * accurate to the mechanism, but it read as a toy demo rather than something an
 * organisation runs.
 */
const HERO_PROMPT = 'Has this customer hit this before?'

const HERO_ANSWERS = [
  {
    key: 'bare',
    label: 'no subject header',
    meta: null,
    answer: 'I have no previous context for this customer.',
  },
  {
    key: 'memory',
    label: 'X-Statewave-Subject: acct:8841',
    meta: '3 episodes · 412 tokens',
    answer:
      'Twice in the last 30 days, both SSO timeouts following the 14:00 deploy.',
  },
] as const

function ConsoleMock() {
  const reduced = useReducedMotion() ?? false

  return (
    <figure className="m-0 min-w-0">
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: 'var(--viz-shell)',
          border: '1px solid var(--viz-border)',
          boxShadow: 'var(--viz-shell-shadow)',
        }}
      >
        {/* request line, the way an engineer reads one */}
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3"
          style={{
            borderBottom: '1px solid var(--viz-border)',
            background: 'var(--viz-shell-header)',
          }}
        >
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em]"
            style={{
              color: 'var(--color-accent-light)',
              background: 'rgba(74,140,255,0.14)',
              border: '1px solid rgba(74,140,255,0.30)',
            }}
          >
            POST
          </span>
          <span className="min-w-0 truncate font-mono text-[11.5px]" style={{ color: 'var(--viz-code-text)' }}>
            /v1/chat/completions
          </span>
          <span
            className="ml-auto flex items-center gap-1.5 font-mono text-[10.5px]"
            style={{ color: 'var(--viz-green)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--viz-green)' }} />
            200
            <span style={{ color: 'var(--viz-text-3)' }}>1.2s</span>
          </span>
        </div>

        {/* the prompt, stated once */}
        <div className="px-5 pt-5 pb-4">
          <div
            className="font-mono text-[10px] uppercase tracking-[0.12em]"
            style={{ color: 'var(--viz-text-3)' }}
          >
            prompt
          </div>
          <p className="mt-2 text-[clamp(1rem,1.2vw,1.125rem)] leading-[1.45] text-theme-primary">
            {HERO_PROMPT}
          </p>
        </div>

        {/* the same call, with and without the header */}
        <div className="flex flex-col">
          {HERO_ANSWERS.map((a, i) => {
            const on = a.key === 'memory'
            return (
              <motion.div
                key={a.key}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + i * 0.18, ease: [0.22, 0.61, 0.36, 1] }}
                className="px-5 py-4"
                style={{
                  borderTop: '1px solid var(--viz-border)',
                  background: on ? 'rgba(122,92,255,0.06)' : 'transparent',
                }}
              >
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={
                      on
                        ? { background: 'var(--color-accent)' }
                        : { border: '1px solid var(--viz-text-3)' }
                    }
                  />
                  <span
                    className="min-w-0 truncate font-mono text-[11px]"
                    style={{ color: on ? 'var(--color-accent)' : 'var(--viz-text-3)' }}
                  >
                    {a.label}
                  </span>
                  {a.meta && (
                    <span
                      className="ml-auto shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px]"
                      style={{
                        color: 'var(--viz-indigo)',
                        background: 'rgba(122,92,255,0.12)',
                        border: '1px solid rgba(122,92,255,0.28)',
                      }}
                    >
                      {a.meta}
                    </span>
                  )}
                </div>
                <p
                  className="mt-2.5 text-[14.5px] leading-[1.55]"
                  style={{
                    color: on ? 'var(--viz-text)' : 'var(--viz-text-3)',
                    fontWeight: on ? 500 : 400,
                  }}
                >
                  {a.answer}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
      <figcaption className="mt-3.5 text-[13.5px] leading-[1.55] text-theme-muted">
        One header, same model, same call.
      </figcaption>
    </figure>
  )
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage: 'radial-gradient(var(--theme-hero-dot) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(52rem 36rem at 50% 32%, rgba(99,102,241,0.11), transparent 72%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, transparent 72%, var(--theme-surface-0) 100%)',
        }}
      />

      <div className="relative z-[2] mx-auto max-w-7xl px-5 pt-28 pb-10 sm:px-6 sm:pt-32 md:pt-36">
        <div className="grid items-center gap-11 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="min-w-0"
          >
            <h1 className="max-w-[22ch] font-heading text-[clamp(2.1rem,6.2vw,3.9rem)] font-semibold leading-[1.07] tracking-[-0.025em] text-theme-primary">
              Your model forgets everything
              <span className="block text-gradient-brand">One header fixes it</span>
            </h1>

            <p className="mt-6 max-w-[62ch] text-[clamp(1.05rem,2.2vw,1.25rem)] leading-[1.55] text-theme-secondary">
              A drop-in, OpenAI-compatible HTTP proxy that gives OpenRouter calls
              persistent memory. Point your existing client at it, add one header,
              and every request arrives with the context of the ones before it.
            </p>

            <div className="relative mt-9 flex flex-wrap gap-3">
              <Button to="/openrouter#start" size="lg">
                <span>Get started</span>
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Button>
              <Button href={REPO_URL} variant="secondary" size="lg">
                View on GitHub
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-2 font-mono text-xs">
              {['CI passing', 'Apache-2.0', 'Python 3.11+', `v${VERSION}`].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full px-3 py-1.5"
                  style={{
                    color: 'var(--viz-indigo)',
                    background: 'var(--viz-fill)',
                    border: '1px solid var(--viz-border-strong)',
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="min-w-0"
          >
            <ConsoleMock />
          </motion.div>
        </div>

        <div
          className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-5 font-mono text-xs uppercase tracking-[0.12em] text-theme-muted"
          style={{ borderTop: '1px solid var(--viz-border)' }}
        >
          <span>40 unit tests</span>
          <span aria-hidden="true" style={{ color: 'var(--viz-text-3)' }}>·</span>
          <span>Python 3.11–3.13</span>
          <span aria-hidden="true" style={{ color: 'var(--viz-text-3)' }}>·</span>
          <span>3 memory-aware endpoints</span>
          <span aria-hidden="true" style={{ color: 'var(--viz-text-3)' }}>·</span>
          <span>Apache 2.0</span>
        </div>
      </div>
    </section>
  )
}

/* ─── The diff ───────────────────────────────────────────────────────────── */

const BEFORE_PY = `client = OpenAI(api_key="sk-or-...")

client.chat.completions.create(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": "What coffee do I like?"}],
)`

const AFTER_PY = `client = OpenAI(base_url="http://localhost:8080/v1", api_key="sk-or-...")

client.chat.completions.create(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": "What coffee do I like?"}],
    extra_headers={"X-Statewave-Subject": "user:42"},
)`

/* The page's central claim is that two lines change and nothing else does.
 * Two code panels side by side asserted that and made the reader diff them by
 * eye; one panel that switches in place lets them watch it happen, which is
 * the same argument with the work removed. Every line is rendered in both
 * states, so a line that does not move visibly does not move — that is the
 * point being made. */
type DiffLine =
  | { kind: 'same'; render: () => ReactNode }
  | { kind: 'changed'; before: () => ReactNode; after: () => ReactNode }
  | { kind: 'added'; after: () => ReactNode }

const DIFF_LINES: DiffLine[] = [
  {
    kind: 'changed',
    before: () => (
      <>
        <span style={txt}>client</span> = <span style={kw}>OpenAI</span>(
        <span style={attr}>api_key</span>=<span style={str}>&quot;sk-or-...&quot;</span>)
      </>
    ),
    after: () => (
      <>
        <span style={txt}>client</span> = <span style={kw}>OpenAI</span>(
        <span style={attr}>base_url</span>=
        <span style={str}>&quot;http://localhost:8080/v1&quot;</span>,{' '}
        <span style={attr}>api_key</span>=<span style={str}>&quot;sk-or-...&quot;</span>)
      </>
    ),
  },
  { kind: 'same', render: () => <>{' '}</> },
  {
    kind: 'same',
    render: () => (
      <>
        <span style={txt}>client</span>.chat.completions.<span style={kw}>create</span>(
      </>
    ),
  },
  {
    kind: 'same',
    render: () => (
      <>
        {'    '}
        <span style={attr}>model</span>=<span style={str}>&quot;openai/gpt-4o&quot;</span>,
      </>
    ),
  },
  {
    kind: 'same',
    render: () => (
      <>
        {'    '}
        <span style={attr}>messages</span>=[{'{'}
        <span style={str}>&quot;role&quot;</span>: <span style={str}>&quot;user&quot;</span>,{' '}
        <span style={str}>&quot;content&quot;</span>:{' '}
        <span style={str}>&quot;What coffee do I like?&quot;</span>
        {'}'}],
      </>
    ),
  },
  {
    kind: 'added',
    after: () => (
      <>
        {'    '}
        <span style={attr}>extra_headers</span>={'{'}
        <span style={str}>&quot;X-Statewave-Subject&quot;</span>:{' '}
        <span style={str}>&quot;user:42&quot;</span>
        {'}'},
      </>
    ),
  },
  { kind: 'same', render: () => <>)</> },
]

function DiffSection() {
  // Defaults to `after`: a landing page should show the payoff without
  // requiring a click, and the highlighted lines make the change legible
  // standing still. The toggle is for checking what it replaced.
  const [showAfter, setShowAfter] = useState(true)
  const reduced = useReducedMotion() ?? false

  const toggle = (value: boolean, label: string) => (
    <button
      key={label}
      type="button"
      onClick={() => setShowAfter(value)}
      aria-pressed={showAfter === value}
      className="rounded-full px-3.5 py-1.5 font-mono text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      style={
        showAfter === value
          ? {
            color: 'var(--viz-text)',
            background: 'rgba(122,92,255,0.18)',
            border: '1px solid rgba(122,92,255,0.45)',
          }
          : {
            color: 'var(--viz-text-3)',
            background: 'transparent',
            border: '1px solid var(--viz-border)',
          }
      }
    >
      {label}
    </button>
  )

  return (
    <Band id="diff" tier="lead" className="!pt-14 sm:!pt-16 lg:!pt-20">
      <BandHead
        id="the-diff"
        tier="lead"
        eyebrow="The whole integration change"
        lede="Two lines. Everything else in your integration stays exactly as it is. No subject header means plain pass-through, so memory is opt-in per request rather than a global mode."
      >
        A base URL and <span className="text-gradient-brand">one header</span>
      </BandHead>

      <Rise className="mt-9 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div
          className="min-w-0 overflow-hidden rounded-2xl"
          style={{
            background: 'var(--viz-code-bg)',
            border: '1px solid var(--viz-border)',
          }}
        >
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5"
            style={{
              background: 'var(--viz-shell-header)',
              borderBottom: '1px solid var(--viz-border)',
            }}
          >
            <div className="flex items-center gap-2">
              {toggle(false, 'before')}
              {toggle(true, 'after')}
            </div>
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-[11px]"
                style={{ color: showAfter ? 'var(--color-accent)' : 'var(--viz-text-3)' }}
              >
                {showAfter ? '2 lines changed' : 'your code today'}
              </span>
              <CodeCopyButton
                code={showAfter ? AFTER_PY : BEFORE_PY}
                label={`Copy the ${showAfter ? 'after' : 'before'} snippet`}
              />
            </div>
          </div>

          <pre className="overflow-x-auto py-4 font-mono text-[13px] leading-[1.85]" style={txt}>
            {DIFF_LINES.map((line, i) => {
              // An added line has no `before` form, so it collapses out
              // entirely rather than leaving a blank gap behind.
              if (line.kind === 'added' && !showAfter) return null
              const marked = line.kind !== 'same' && showAfter
              const content =
                line.kind === 'same'
                  ? line.render()
                  : line.kind === 'added'
                    ? line.after()
                    : showAfter
                      ? line.after()
                      : line.before()
              return (
                <motion.span
                  key={i}
                  layout={reduced ? false : 'position'}
                  transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
                  className={`block ${marked ? 'pl-[13px] pr-4' : 'px-4'}`}
                  style={
                    marked
                      ? {
                        borderLeft: '3px solid var(--color-accent)',
                        background: 'rgba(122,92,255,0.12)',
                      }
                      : undefined
                  }
                >
                  <motion.span
                    // Keyed on the state so the text itself crossfades when a
                    // changed line swaps content, instead of snapping.
                    key={`${i}-${showAfter}`}
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.22 }}
                    className="block"
                  >
                    {content}
                  </motion.span>
                </motion.span>
              )
            })}
          </pre>
        </div>

        <div className={`${CARD} min-w-0 p-6`}>
          <Eyebrow>What just happened</Eyebrow>
          <ul className="mt-4 flex list-none flex-col gap-3.5 p-0">
            <Bullet>
              The proxy assembled a <L to="/product">memory bundle</L> for{' '}
              <C>user:42</C> and injected it as a system message.
            </Bullet>
            <Bullet>The call went to OpenRouter unchanged otherwise.</Bullet>
            <Bullet>
              The turn was written back as an episode, after the response was already
              sent.
            </Bullet>
          </ul>
        </div>
      </Rise>
    </Band>
  )
}

/* ─── Request flow ───────────────────────────────────────────────────────── */

const FLOW_STEPS = [
  { n: '01', title: 'Client calls the proxy', body: 'Any OpenAI-compatible SDK, unchanged.' },
  {
    n: '02',
    title: 'Context fetched',
    body: 'Proxy assembles the memory bundle for that subject from Statewave.',
  },
  {
    n: '03',
    title: 'Forwarded to OpenRouter',
    body: 'Bundle injected into the request, then passed upstream.',
  },
  { n: '04', title: 'Reply relayed back', body: 'Response returned to the client as-is.' },
] as const

const FLOW_NOTES = [
  {
    title: 'No added latency.',
    body: 'The episode write is fire-and-forget. It happens after the reply is already on its way to the client.',
  },
  {
    title: 'Streaming is not a special case.',
    body: 'SSE chunks relay byte-for-byte as they arrive. The reply is reassembled line by line, so a long stream costs the reply text, not a second copy of the body. The episode is written when the stream closes.',
  },
  {
    title: 'Empty replies write nothing.',
    body: "A turn with no answer in it is noise in the subject's memory, not history.",
  },
] as const

function FlowSection() {
  return (
    <Band id="flow" tier="lead" surface>
      <BandHead id="request-flow" tier="lead" eyebrow="How a request flows">
        Memory in, completion out,{' '}
        <span className="text-gradient-brand">episode written after</span>
      </BandHead>

      <Rise className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {FLOW_STEPS.map((step) => (
          <div key={step.n} className={`${CARD} min-w-0 p-[18px]`}>
            <div className="font-mono text-[11px]" style={{ color: 'var(--color-accent)' }}>
              {step.n}
            </div>
            <div className="mt-2 text-[14.5px] font-medium text-theme-primary">{step.title}</div>
            <div className="mt-1.5 text-[13px] leading-[1.55] text-theme-muted">{step.body}</div>
          </div>
        ))}
        <div
          className="min-w-0 rounded-2xl p-[18px]"
          style={{
            border: '1px dashed rgba(122,92,255,0.45)',
            background: 'rgba(122,92,255,0.07)',
          }}
        >
          <div
            className="flex flex-wrap items-center gap-2 font-mono text-[11px]"
            style={{ color: 'var(--viz-indigo)' }}
          >
            05
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px]"
              style={{
                border: '1px solid rgba(122,92,255,0.24)',
                background: 'rgba(122,92,255,0.10)',
              }}
            >
              fire-and-forget
            </span>
          </div>
          <div className="mt-2 text-[14.5px] font-medium text-theme-primary">
            Episode written back
          </div>
          <div className="mt-1.5 text-[13px] leading-[1.55] text-theme-muted">
            Turn stored in Statewave asynchronously, off the critical path.
          </div>
        </div>
      </Rise>

      <Rise className="mt-5 grid gap-[18px] md:grid-cols-2">
        <div className={`${CARD} min-w-0 p-[22px]`}>
          <Eyebrow>What the proxy touches</Eyebrow>
          <ul className="mt-3.5 flex list-none flex-col gap-3 p-0">
            <Bullet>
              It adds the memory bundle to the request and reads the reply text back
              out.
            </Bullet>
            <Bullet>
              Statewave headers and the <C>statewave_subject</C> body field are
              stripped before the call goes upstream.
            </Bullet>
            <Bullet>
              Model, temperature, tools, and every other parameter pass through
              untouched.
            </Bullet>
          </ul>
        </div>
        <div className={`${CARD} min-w-0 p-[22px]`}>
          <Eyebrow>What it leaves alone</Eyebrow>
          <ul className="mt-3.5 flex list-none flex-col gap-3 p-0">
            <Bullet muted>
              A request with no subject is a plain pass-through, byte for byte.
            </Bullet>
            <Bullet muted>
              Non-completion paths such as <C>/v1/models</C> are forwarded as-is.
            </Bullet>
            <Bullet muted>
              Your OpenRouter key stays your key; the proxy forwards it rather than
              replacing it.
            </Bullet>
          </ul>
        </div>
      </Rise>

      <Rise className="mt-10 grid gap-[18px] md:grid-cols-3">
        {FLOW_NOTES.map((note) => (
          <div key={note.title} className={`${CARD} min-w-0 p-[22px]`}>
            <div className="text-[15px] font-semibold text-theme-primary">{note.title}</div>
            <p className="mt-2.5 text-sm leading-[1.6] text-theme-secondary">{note.body}</p>
          </div>
        ))}
      </Rise>
    </Band>
  )
}

/* ─── Endpoints ──────────────────────────────────────────────────────────── */

/** Decorative glyphs — the endpoint name and the "bundle goes" cell next to
 *  each one already carry the meaning, so they stay out of the a11y tree. */
function ChatGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" className="flex-none">
      <rect
        x="2.5"
        y="3"
        width="19"
        height="5"
        rx="1.5"
        fill="rgba(122,92,255,0.16)"
        stroke="var(--color-accent)"
      />
      <rect x="2.5" y="10.5" width="19" height="4.5" rx="1.5" fill="none" stroke="var(--viz-text-3)" />
      <rect x="2.5" y="17" width="19" height="4.5" rx="1.5" fill="none" stroke="var(--viz-text-3)" />
    </svg>
  )
}

function CompletionsGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" className="flex-none">
      <rect
        x="2.5"
        y="4"
        width="8"
        height="3.5"
        rx="1.5"
        fill="rgba(122,92,255,0.16)"
        stroke="var(--color-accent)"
      />
      <line x1="2.5" y1="12" x2="21.5" y2="12" stroke="var(--viz-text-3)" />
      <line x1="2.5" y1="16" x2="21.5" y2="16" stroke="var(--viz-text-3)" />
      <line x1="2.5" y1="20" x2="15" y2="20" stroke="var(--viz-text-3)" />
    </svg>
  )
}

function ResponsesGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" className="flex-none">
      <rect
        x="2.5"
        y="3"
        width="19"
        height="6"
        rx="1.5"
        fill="rgba(122,92,255,0.16)"
        stroke="var(--color-accent)"
      />
      <rect x="2.5" y="11.5" width="19" height="10" rx="1.5" fill="none" stroke="var(--viz-text-3)" />
    </svg>
  )
}

function EndpointsSection() {
  return (
    <Band id="endpoints">
      <BandHead id="endpoints-heading" eyebrow="Three memory-aware endpoints">
        Where the bundle goes, <span className="text-gradient-brand">per endpoint</span>
      </BandHead>

      <Rise className="mt-8">
        <DataTable
          minWidth={640}
          headers={['Endpoint', 'Bundle goes', 'Reply read from']}
          rows={[
            [
              <span className="flex items-center gap-2.5">
                <ChatGlyph />
                <span>POST /v1/chat/completions</span>
              </span>,
              <>
                a <C>system</C> message, first in <C>messages</C>
              </>,
              <span className="font-mono text-[13px] whitespace-nowrap">
                choices[].message.content
              </span>,
            ],
            [
              <span className="flex items-center gap-2.5">
                <CompletionsGlyph />
                <span>POST /v1/completions</span>
              </span>,
              <>
                ahead of <C>prompt</C>
              </>,
              <span className="font-mono text-[13px] whitespace-nowrap">choices[].text</span>,
            ],
            [
              <span className="flex items-center gap-2.5">
                <ResponsesGlyph />
                <span>POST /v1/responses</span>
              </span>,
              <>
                ahead of <C>instructions</C>; <C>input</C> untouched
              </>,
              <span className="font-mono text-[13px] whitespace-nowrap">
                output[].content[].text
              </span>,
            ],
          ]}
        />
      </Rise>

      <Rise>
        <p className="mt-[18px] max-w-[70ch] text-sm text-theme-muted">
          Every other path (<C>/v1/models</C>, <C>/v1/credits</C>, the rest) is proxied
          straight through, so this is a drop-in base URL replacement.
        </p>
      </Rise>
    </Band>
  )
}

/* ─── Subjects and sessions ──────────────────────────────────────────────── */

const SUBJECT_CURL = `curl http://localhost:8080/v1/chat/completions \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -H "X-Statewave-Subject: user:42" \\
  -H "X-Statewave-Session: sess_abc" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"openai/gpt-4o","messages":[{"role":"user","content":"What coffee do I like?"}]}'`

function SubjectTimeline() {
  const turns = [
    { x: 2, cx: 105, label: 'turn 1', text: 'oat lattes', session: 'no session', dot: 'var(--color-accent)', stroke: 'var(--viz-border)' },
    { x: 237, cx: 340, label: 'turn 2', text: 'no sugar', session: 'session: sess_abc', dot: 'var(--color-accent-light)', stroke: 'rgba(74,140,255,0.34)' },
    { x: 472, cx: 575, label: 'turn 3', text: 'decaf after 4pm', session: 'session: sess_abc', dot: 'var(--color-accent-light)', stroke: 'rgba(74,140,255,0.34)' },
  ]
  return (
    <figure className="sw-scroll-x m-0 mx-auto min-w-0 max-w-[680px] overflow-x-auto">
      <svg
        viewBox="0 0 680 236"
        role="img"
        aria-labelledby="subTitle subDesc"
        preserveAspectRatio="xMidYMid meet"
        className="mx-auto block h-auto w-full min-w-[480px] max-w-[680px]"
      >
        <title id="subTitle">Turns accumulating under one subject</title>
        <desc id="subDesc">
          Three turns recorded under the subject user:42 accumulate into a compiled
          memory bundle. The second and third turns also carry the session sess_abc,
          showing that a session scopes a run of turns inside a subject.
        </desc>
        <text x="2" y="16" className="font-mono" fontSize="12" fill="var(--viz-indigo)">
          subject: user:42
        </text>
        <line x1="2" y1="54" x2="678" y2="54" stroke="var(--viz-border)" strokeWidth="1.5" />
        {turns.map((t) => (
          <g key={t.label}>
            <circle cx={t.cx} cy="54" r="6" fill={t.dot} />
            <rect x={t.x} y="74" width="206" height="78" rx="14" fill="var(--viz-card)" stroke={t.stroke} />
            <text x={t.cx} y="98" textAnchor="middle" className="font-mono" fontSize="11" fill="var(--viz-text-3)">
              {t.label}
            </text>
            <text x={t.cx} y="120" textAnchor="middle" fontSize="13" fill="var(--viz-text)">
              {t.text}
            </text>
            <text
              x={t.cx}
              y="140"
              textAnchor="middle"
              className="font-mono"
              fontSize="10"
              fill={t.session === 'no session' ? 'var(--viz-text-3)' : 'var(--viz-indigo)'}
            >
              {t.session}
            </text>
            <path d={`M${t.cx} 156 L${t.cx} 176`} stroke="var(--viz-text-3)" strokeWidth="1.2" />
          </g>
        ))}
        <rect
          x="2"
          y="178"
          width="676"
          height="52"
          rx="14"
          fill="rgba(122,92,255,0.08)"
          stroke="rgba(122,92,255,0.30)"
        />
        <text x="340" y="209" textAnchor="middle" className="font-mono" fontSize="12.5" fill="var(--viz-indigo)">
          compiled memory bundle for user:42
        </text>
      </svg>
      <figcaption className="mt-3.5 text-[13.5px] text-theme-muted">
        A session scopes a run of turns inside a subject; the subject keeps the memory.
      </figcaption>
    </figure>
  )
}

/* Four reference facts. They were four separate cards stacked in a narrow
 * column beside the heading, which left 245px of dead space under a two-line
 * heading and gave each card a different height for no reason. A term/definition
 * grid is what this content actually is. */
const SUBJECT_FACTS: { term: string; body: () => ReactNode }[] = [
  {
    term: 'subject',
    body: () => (
      <>
        Who the memory belongs to: <C>user:42</C>, <C>team:acme</C>. This is the unit
        memory accumulates against.
      </>
    ),
  },
  {
    term: 'session',
    body: () => <>Optional. Scopes a run of turns inside a subject.</>,
  },
  {
    term: 'set via',
    body: () => (
      <>
        The <C>X-Statewave-Subject</C> header, or a <C>statewave_subject</C> body field
        for clients that cannot set headers. The header wins, and body fields are
        stripped before the request reaches OpenRouter.
      </>
    ),
  },
  {
    term: 'id format',
    body: () => (
      <>
        1–256 characters of letters, digits, underscore, dot, dash or colon. Anything
        else is rejected with <C>400</C> before any upstream call.
      </>
    ),
  },
]

function SubjectsSection() {
  return (
    <Band id="subjects" surface>
      <BandHead
        id="subjects-heading"
        eyebrow="Subjects and sessions"
        lede={
          <>
            A subject is the <L to="/product">unit of memory</L>. A session narrows it
            to one run of turns.
          </>
        }
      >
        Who the memory <span className="text-gradient-brand">belongs to</span>
      </BandHead>

      {/* The diagram is the explanation, so it leads. Capped to the SVG's own
          width so the caption sits under the graphic rather than 276px to its
          left, which is what a full-width figure around a centred SVG gave. */}
      <Rise className="mt-9">
        <SubjectTimeline />
      </Rise>

      <Rise className="mt-9">
        <CodePanel label="subject and session, over plain HTTP" code={SUBJECT_CURL}>
          <span style={kw}>curl</span> http://localhost:8080/v1/chat/completions \{'\n'}
          {'  '}-H <span style={str}>&quot;Authorization: Bearer $OPENROUTER_API_KEY&quot;</span> \
          {'\n'}
          {'  '}-H <span style={str}>&quot;X-Statewave-Subject: user:42&quot;</span> \{'\n'}
          {'  '}-H <span style={str}>&quot;X-Statewave-Session: sess_abc&quot;</span> \{'\n'}
          {'  '}-H <span style={str}>&quot;Content-Type: application/json&quot;</span> \{'\n'}
          {'  '}-d{' '}
          <span style={str}>
            {
              '\'{"model":"openai/gpt-4o","messages":[{"role":"user","content":"What coffee do I like?"}]}\''
            }
          </span>
        </CodePanel>
      </Rise>

      {/* Full width rather than beside the curl panel: as a single column the
          four definitions ran 425px against the panel's 236px, so pairing them
          just moved the dead space from under the heading to under the code.
          Two columns also let each row size to its taller cell. */}
      <Rise className="mt-6">
        <dl className={`${CARD} m-0 grid min-w-0 gap-x-8 gap-y-5 p-6 md:grid-cols-2`}>
          {SUBJECT_FACTS.map((f) => (
            <div key={f.term} className="min-w-0">
              <dt
                className="font-mono text-[11px] uppercase tracking-[0.1em]"
                style={{ color: 'var(--viz-indigo)' }}
              >
                {f.term}
              </dt>
              <dd className="m-0 mt-1.5 text-[14.5px] leading-[1.6] text-theme-secondary">
                {f.body()}
              </dd>
            </div>
          ))}
        </dl>
      </Rise>
    </Band>
  )
}

/* ─── Auth ───────────────────────────────────────────────────────────────── */

/* The three outcomes the gate can produce, keyed to the three config cards
 * below it. Selecting a card holds that branch at full strength and drops the
 * other two back, so the diagram answers "what do I get if I set this?"
 * rather than showing all three states at once and leaving the reader to
 * work out which one is theirs. */
type TrustMode = 'none' | 'header' | 'jwt'

const TRUST_MODES: readonly {
  key: TrustMode
  chip: string
  chipTint: string
  title: string
  mono: boolean
  body: ReactNode
}[] = [
  {
    key: 'none',
    chip: 'safe default',
    chipTint: 'rgba(74,140,255,',
    title: 'Nothing set',
    mono: false,
    body: (
      <>
        A request carrying a subject gets <C>400 statewave_untrusted_subject</C>.
        This is the safe default, not a mode.
      </>
    ),
  },
  {
    key: 'header',
    chip: 'trusted network',
    chipTint: 'rgba(122,92,255,',
    title: 'STATEWAVE_TRUST_CLIENT_SUBJECT=1',
    mono: true,
    body: (
      <>
        The header is trusted as sent. For a laptop, a private network, or behind a
        gateway that already authenticates.
      </>
    ),
  },
  {
    key: 'jwt',
    chip: 'public clients',
    chipTint: 'rgba(122,92,255,',
    title: 'PROXY_JWT_SECRET',
    mono: true,
    body: (
      <>
        Every route but <C>/health</C> needs a signed token; the subject is the
        token&apos;s <C>sub</C> claim. Tokens must carry <C>exp</C>. For anything
        reachable by clients you do not control.
      </>
    ),
  },
]

/* Outcome nodes, laid out on one grid so the three branches are comparable at
 * a glance: same width, same height, even vertical pitch. The earlier version
 * sized every node differently and fanned straight diagonals out of a small
 * box, which read as a whiteboard sketch rather than a diagram. */
const GATE_OUTCOMES: {
  key: TrustMode
  y: number
  title: string
  sub: string
  accent: string
  /** Dashed outline marks the branch that refuses the request. */
  dashed?: boolean
}[] = [
  { key: 'none', y: 6, title: '400 rejected', sub: 'nothing configured', accent: 'var(--viz-amber)', dashed: true },
  { key: 'header', y: 100, title: 'header as sent', sub: 'trusted network', accent: 'var(--color-accent-light)' },
  { key: 'jwt', y: 194, title: 'sub claim', sub: 'signed token', accent: 'var(--color-accent)' },
]

function TrustGateDiagram({ mode }: { mode: TrustMode }) {
  // Inactive branches drop back but stay readable — at 0.28 they looked
  // disabled rather than simply not-selected, which is a different claim.
  const on = (k: TrustMode) => (mode === k ? 1 : 0.5)

  return (
    <figure className="m-0 min-w-0">
      <svg
        viewBox="0 0 492 256"
        role="img"
        aria-labelledby="authTitle authDesc"
        className="block h-auto w-full"
      >
        <title id="authTitle">How the proxy decides whether to trust a subject</title>
        <desc id="authDesc">
          A request naming a subject reaches the trust gate. With nothing configured
          it is rejected with 400. With the trust flag set the header is taken as
          sent. With a JWT secret set the subject is taken from the token&apos;s sub
          claim.
        </desc>

        {/* request */}
        <rect x="0" y="102" width="122" height="52" rx="13" fill="var(--viz-card)" stroke="var(--viz-border)" />
        <text x="61" y="124" textAnchor="middle" fontSize="13" fill="var(--viz-text)">
          request
        </text>
        <text x="61" y="141" textAnchor="middle" className="font-mono" fontSize="10" fill="var(--viz-text-3)">
          names a subject
        </text>

        <line x1="122" y1="128" x2="154" y2="128" stroke="var(--viz-text-3)" strokeWidth="1.5" />

        {/* the gate */}
        <rect
          x="154"
          y="98"
          width="94"
          height="60"
          rx="14"
          fill="rgba(122,92,255,0.10)"
          stroke="var(--color-accent)"
          strokeWidth="1.6"
        />
        <text x="201" y="122" textAnchor="middle" className="font-mono" fontSize="11" fill="var(--viz-indigo)">
          trust
        </text>
        <text x="201" y="138" textAnchor="middle" className="font-mono" fontSize="11" fill="var(--viz-indigo)">
          gate
        </text>

        {GATE_OUTCOMES.map((o) => {
          const cy = o.y + 29
          const active = mode === o.key
          // Cubic out of the gate's right edge into the node's left edge, so
          // every branch leaves and lands horizontally instead of cutting a
          // diagonal across the frame.
          const d = `M248 128 C278 128 278 ${cy} 306 ${cy}`
          return (
            <g
              key={o.key}
              className="transition-opacity duration-300"
              style={{ opacity: on(o.key) }}
            >
              <path
                d={d}
                fill="none"
                stroke={active ? o.accent : 'var(--viz-text-3)'}
                strokeWidth={active ? 2 : 1.3}
                strokeLinecap="round"
              />
              <rect
                x="306"
                y={o.y}
                width="186"
                height="58"
                rx="14"
                fill={active ? 'var(--viz-card-2)' : 'var(--viz-card)'}
                stroke={active ? o.accent : 'var(--viz-border)'}
                strokeWidth={active ? 1.6 : 1}
                strokeDasharray={o.dashed ? '6 5' : undefined}
              />
              {/* state pip, so each outcome is identifiable without colour alone */}
              <circle cx="326" cy={o.y + 29} r="4" fill={active ? o.accent : 'var(--viz-text-3)'} />
              <text x="342" y={o.y + 26} className="font-mono" fontSize="12" fill={active ? o.accent : 'var(--viz-text)'}>
                {o.title}
              </text>
              <text x="342" y={o.y + 43} className="font-mono" fontSize="10" fill="var(--viz-text-3)">
                {o.sub}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-4 text-[13.5px] text-theme-muted">
        One gate, three outcomes. Pick a setting below to follow its branch.
      </figcaption>
    </figure>
  )
}

function AuthSection() {
  const [mode, setMode] = useState<TrustMode>('none')
  // Hover previews a branch without committing to it; the click still pins.
  // Without this the diagram only ever moved on click, so nothing invited the
  // reader to try it — the cards looked like three static panels.
  const [preview, setPreview] = useState<TrustMode | null>(null)
  const shown = preview ?? mode

  return (
    <Band id="auth">
      <BandHead id="auth-heading" eyebrow="Authenticating the subject">
        One decision to get right{' '}
        <span className="text-gradient-brand">before you deploy</span>
      </BandHead>

      <Rise className="mt-7 grid items-center gap-9 md:grid-cols-2">
        <div className="min-w-0">
          {/* The rule is a positioned span, not `border-image`. A gradient
              border-image ignores border-radius and paints a hard, square bar
              detached from the text — which is exactly how it looked. */}
          <blockquote className="relative m-0 pl-6 text-[clamp(1.15rem,2.4vw,1.45rem)] font-medium leading-[1.45] tracking-[-0.01em] text-theme-primary">
            <span
              aria-hidden="true"
              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
              style={{
                background:
                  'linear-gradient(180deg, var(--color-accent), var(--color-accent-light))',
              }}
            />
            Whoever can name a subject can read and write that subject&apos;s memory.
          </blockquote>
          <p className="mt-5 max-w-[54ch] text-[15px] leading-[1.7] text-theme-secondary">
            So the proxy will not take a subject id on faith. Until you tell it which
            clients are trustworthy, a request that names one is refused outright
            rather than quietly reading somebody else&apos;s memory.
          </p>
        </div>
        <TrustGateDiagram mode={shown} />
      </Rise>

      <Rise className="mt-9 grid gap-[18px] md:grid-cols-3">
        {TRUST_MODES.map((m) => {
          const active = mode === m.key
          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(m.key)}
              onMouseEnter={() => setPreview(m.key)}
              onMouseLeave={() => setPreview(null)}
              onFocus={() => setPreview(m.key)}
              onBlur={() => setPreview(null)}
              className={`${CARD} min-w-0 cursor-pointer p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                active ? '!border-brand-500/55' : ''
              }`}
            >
              <span
                className="inline-flex rounded-full px-2.5 py-1 font-mono text-[11px]"
                style={{
                  color: 'var(--viz-indigo)',
                  background: m.chipTint + (active ? '0.18)' : '0.08)'),
                  border: '1px solid ' + m.chipTint + '0.18)',
                }}
              >
                {m.chip}
              </span>
              <div
                className={`mt-3.5 font-semibold text-theme-primary ${
                  m.mono ? 'overflow-x-auto font-mono text-sm' : 'text-base'
                }`}
              >
                {m.title}
              </div>
              <p className="mt-2.5 text-sm leading-[1.6] text-theme-secondary">{m.body}</p>
            </button>
          )
        })}
      </Rise>
    </Band>
  )
}

/* ─── Fails open ─────────────────────────────────────────────────────────── */

/* A fork and a merge, not two parallel rows.
 *
 * The claim is that exactly one step differs and everything around it is
 * identical, so `request`, `completion` and `200 OK` are drawn once and shared.
 * The previous version repeated all three per row, which made the two paths
 * look like two different systems and buried the one node that actually
 * changes. Hovering a branch traces it and drops the other back.
 */
const FO_BRANCHES = [
  {
    key: 'healthy' as const,
    y: 14,
    label: 'STATEWAVE HEALTHY',
    title: 'context ok',
    sub: 'bundle assembled',
    reply: 'with memory',
    fill: 'rgba(122,92,255,0.08)',
    stroke: 'var(--color-accent)',
    color: 'var(--viz-indigo)',
  },
  {
    key: 'failed' as const,
    y: 132,
    label: 'STATEWAVE UNREACHABLE',
    title: 'context failed',
    sub: 'logged, not raised',
    reply: 'no memory',
    fill: 'rgba(245,158,11,0.10)',
    stroke: 'var(--viz-amber)',
    color: 'var(--viz-amber)',
    dashed: true,
  },
]

function FailsOpenDiagram() {
  const [trace, setTrace] = useState<'healthy' | 'failed' | null>(null)
  const dim = (k: 'healthy' | 'failed') => (trace && trace !== k ? 0.32 : 1)

  return (
    <figure className="sw-scroll-x m-0 mx-auto min-w-0 max-w-[680px] overflow-x-auto">
      <svg
        viewBox="0 0 680 208"
        role="img"
        aria-labelledby="foTitle foDesc"
        className="block h-auto w-full min-w-[540px] max-w-[680px]"
      >
        <title id="foTitle">Fails-open comparison</title>
        <desc id="foDesc">
          One request forks at the context step. When Statewave is healthy the bundle
          is assembled; when it is unreachable the failure is logged rather than
          raised. Both paths rejoin and return 200 OK, and only the memory in the
          reply differs.
        </desc>

        {/* shared entry */}
        <rect x="0" y="77" width="110" height="54" rx="13" fill="var(--viz-card)" stroke="var(--viz-border)" />
        <text x="55" y="109" textAnchor="middle" fontSize="13" fill="var(--viz-text)">
          request
        </text>

        {FO_BRANCHES.map((b) => {
          const cy = b.y + 27
          const active = trace === b.key
          return (
            <g
              key={b.key}
              // Focusable and focus-driven, not hover-only: an SVG <g> takes no
              // keyboard focus by default, so without this the branch trace was
              // unreachable for anyone not using a pointer.
              tabIndex={0}
              role="button"
              aria-label={`Trace the ${b.label.toLowerCase()} path`}
              aria-pressed={trace === b.key}
              className="transition-opacity duration-300 focus:outline-none"
              style={{ opacity: dim(b.key), cursor: 'pointer' }}
              onMouseEnter={() => setTrace(b.key)}
              onMouseLeave={() => setTrace(null)}
              onFocus={() => setTrace(b.key)}
              onBlur={() => setTrace(null)}
            >
              {/* visible focus ring, since SVG gets no UA outline */}
              {trace === b.key && (
                <rect
                  x="182"
                  y={b.y - 4}
                  width="178"
                  height="62"
                  rx="17"
                  fill="none"
                  stroke={b.stroke}
                  strokeWidth="1"
                  opacity="0.45"
                />
              )}
              {/* fork out, then merge back: both curves leave and arrive
                  horizontally so the join reads as a rejoin, not a collision */}
              <path
                d={`M110 104 C148 104 148 ${cy} 186 ${cy}`}
                fill="none"
                stroke={active ? b.stroke : 'var(--viz-text-3)'}
                strokeWidth={active ? 2 : 1.4}
                strokeLinecap="round"
              />
              <path
                d={`M356 ${cy} C394 ${cy} 394 104 432 104`}
                fill="none"
                stroke={active ? b.stroke : 'var(--viz-text-3)'}
                strokeWidth={active ? 2 : 1.4}
                strokeLinecap="round"
              />

              <text x="186" y={b.y - 8} className="font-mono" fontSize="10" letterSpacing="1.2" fill="var(--viz-text-3)">
                {b.label}
              </text>
              <rect
                x="186"
                y={b.y}
                width="170"
                height="54"
                rx="13"
                fill={b.fill}
                stroke={b.stroke}
                strokeWidth={active ? 1.8 : 1.1}
                strokeDasharray={b.dashed ? '6 5' : undefined}
              />
              <text x="271" y={b.y + 24} textAnchor="middle" fontSize="13" fontWeight="500" fill={b.color}>
                {b.title}
              </text>
              <text x="271" y={b.y + 42} textAnchor="middle" className="font-mono" fontSize="10.5" fill="var(--viz-text-3)">
                {b.sub}
              </text>

              {/* what each path is carrying when it rejoins */}
              <text
                x="394"
                y={b.key === 'healthy' ? b.y + 14 : b.y + 48}
                textAnchor="middle"
                className="font-mono"
                fontSize="10"
                fill={active ? b.color : 'var(--viz-text-3)'}
              >
                {b.reply}
              </text>
            </g>
          )
        })}

        {/* shared exit */}
        <rect x="432" y="77" width="118" height="54" rx="13" fill="var(--viz-card)" stroke="var(--viz-border)" />
        <text x="491" y="109" textAnchor="middle" fontSize="13" fill="var(--viz-text)">
          completion
        </text>
        <line x1="550" y1="104" x2="568" y2="104" stroke="var(--viz-text-3)" strokeWidth="1.5" />
        <rect
          x="568"
          y="77"
          width="112"
          height="54"
          rx="13"
          fill="rgba(74,140,255,0.08)"
          stroke="rgba(74,140,255,0.34)"
        />
        <text x="624" y="100" textAnchor="middle" className="font-mono" fontSize="13" fontWeight="500" fill="var(--viz-text)">
          200 OK
        </text>
        <text x="624" y="117" textAnchor="middle" className="font-mono" fontSize="10" fill="var(--viz-text-3)">
          either way
        </text>
      </svg>
      <figcaption className="mt-4 text-[13.5px] text-theme-muted">
        One step differs. Hover a branch to trace it: the reply is a success on both.
      </figcaption>
    </figure>
  )
}

const FAILURE_CARDS = [
  {
    eyebrow: 'Context read fails',
    title: 'The call still goes out',
    body: 'No bundle is injected, the error is logged, and the completion is forwarded as though no subject had been supplied. The client sees a normal reply with no memory in it.',
  },
  {
    eyebrow: 'Episode write fails',
    title: 'The client never notices',
    body: 'The write happens after the reply has been sent, so a failure there cannot affect the response. That turn is missing from the subject’s history and the next one carries on from what is stored.',
  },
  {
    eyebrow: 'OpenRouter fails',
    title: 'The upstream error reaches you',
    body: 'Upstream status codes and error bodies are relayed rather than rewritten, so your existing error handling keeps working. Nothing is written to memory for a turn that produced no answer.',
  },
] as const

function FailsOpenSection() {
  return (
    <Band id="failsopen" surface>
      <BandHead
        id="fails-open-heading"
        eyebrow="Fails open"
        lede={
          <>
            If context assembly or the episode write fails, whether the server is
            down, the key is wrong, or the call times out, it is logged and the
            completion still goes through, just without memory for that turn. A
            Statewave outage degrades your app&apos;s{' '}
            <L to="/benchmarks">memory quality</L>. It does not take it down.
          </>
        }
      >
        An enhancement,{' '}
        <span className="text-gradient-brand">never a hard dependency</span>
      </BandHead>

      <Rise className="mt-9">
        <FailsOpenDiagram />
      </Rise>

      <Rise className="mt-6">
        <div className={`${CARD} p-5`}>
          <p className="text-[14.5px] leading-[1.6] text-theme-secondary">
            On shutdown, in-flight episode writes are drained before the HTTP client
            closes, since that is the only place a turn exists before Statewave has it.
          </p>
        </div>
      </Rise>

      <Rise className="mt-8 grid gap-[18px] md:grid-cols-3">
        {FAILURE_CARDS.map((card) => (
          <div key={card.eyebrow} className={`${CARD} min-w-0 p-[22px]`}>
            <Eyebrow>{card.eyebrow}</Eyebrow>
            <div className="mt-3 text-[15px] font-semibold text-theme-primary">{card.title}</div>
            <p className="mt-2.5 text-sm leading-[1.6] text-theme-secondary">{card.body}</p>
          </div>
        ))}
      </Rise>
    </Band>
  )
}

/* ─── Configuration ──────────────────────────────────────────────────────── */

function ConfigSection() {
  return (
    <Band id="config">
      <BandHead
        id="config-heading"
        eyebrow="Configuration"
        lede="Everything is read from the environment, so the same image runs on a laptop and behind a gateway with no code change. The first two are required for memory to work at all; the last two decide who is allowed to name a subject."
      >
        Four settings decide <span className="text-gradient-brand">how it behaves</span>
      </BandHead>

      <Rise className="mt-8">
        <DataTable
          minWidth={620}
          headers={['Variable', 'What it does', 'When']}
          rows={[
            [
              'OPENROUTER_API_KEY',
              'The key used for upstream calls when the client does not send its own.',
              <span className="whitespace-nowrap text-theme-muted">Always</span>,
            ],
            [
              'STATEWAVE_URL',
              'Where the memory runtime lives. Without it, requests are proxied with no memory.',
              <span className="whitespace-nowrap text-theme-muted">Always</span>,
            ],
            [
              'STATEWAVE_TRUST_CLIENT_SUBJECT',
              'Takes the subject header at face value.',
              <span className="text-theme-muted">
                Local, private network, or behind an authenticating gateway
              </span>,
            ],
            [
              'PROXY_JWT_SECRET',
              <>
                Requires a signed token on every route but <C>/health</C>, and takes
                the subject from its <C>sub</C> claim.
              </>,
              <span className="text-theme-muted">
                Anything reachable by clients you do not control
              </span>,
            ],
          ]}
        />
      </Rise>

      <Rise>
        <p className="mt-[18px] max-w-[72ch] text-sm leading-[1.65] text-theme-muted">
          The shipped <C>.env.example</C> lists the remaining optional settings with
          their defaults. Note that the process does not read <C>.env</C> on its own,
          so pass <C>--env-file .env</C> when you start it.
        </p>
      </Rise>
    </Band>
  )
}

/* ─── Quick start ────────────────────────────────────────────────────────── */

const PIP_CMD = `pip install statewave-openrouter
cp .env.example .env     # set OPENROUTER_API_KEY and STATEWAVE_URL
uvicorn statewave_openrouter:app --port 8080 --env-file .env`

const DOCKER_CMD = `docker run --rm -p 8080:8080 --env-file .env \\
  ghcr.io/smaramwbc/statewave-openrouter:${VERSION}`

const VERIFY_CMD = `curl http://localhost:8080/health
# {"status":"ok"}`

const CLIENT_TS = `const client = new OpenAI({
  baseURL: "http://localhost:8080/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

await client.chat.completions.create(
  { model: "openai/gpt-4o", messages },
  { headers: { "X-Statewave-Subject": "user:42" } },
);`

function QuickStartSection() {
  const [tab, setTab] = useState<'pip' | 'docker'>('pip')
  const isPip = tab === 'pip'

  const tabButton = (value: 'pip' | 'docker', label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setTab(value)}
      aria-pressed={tab === value}
      className="rounded-full px-3.5 py-1.5 font-mono text-xs transition-colors"
      style={
        tab === value
          ? {
            color: 'var(--viz-text)',
            background: 'rgba(122,92,255,0.18)',
            border: '1px solid rgba(122,92,255,0.45)',
          }
          : {
            color: 'var(--viz-text-3)',
            background: 'transparent',
            border: '1px solid var(--viz-border)',
          }
      }
    >
      {label}
    </button>
  )

  return (
    <Band id="start" tier="lead" surface>
      <BandHead id="quick-start-heading" tier="lead" eyebrow="Quick start">
        Running in <span className="text-gradient-brand">three commands</span>
      </BandHead>

      <Rise
        className="mt-8 min-w-0 overflow-hidden rounded-2xl"
        style={{ background: 'var(--viz-code-bg)', border: '1px solid var(--viz-border)' }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5"
          style={{
            background: 'var(--viz-shell-header)',
            borderBottom: '1px solid var(--viz-border)',
          }}
        >
          <div className="flex gap-2">
            {tabButton('pip', 'pip')}
            {tabButton('docker', 'Docker')}
          </div>
          <div className="flex items-center gap-3.5">
            <a
              href={`${REPO_URL}#quick-start`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline"
            >
              Full guide
            </a>
            <CodeCopyButton
              code={isPip ? PIP_CMD : DOCKER_CMD}
              label={`Copy the ${isPip ? 'pip' : 'Docker'} quick start commands`}
            />
          </div>
        </div>
        <pre
          className="overflow-x-auto px-4 py-5 font-mono text-[13px] leading-[1.9]"
          style={txt}
        >
          {isPip ? (
            <>
              <span style={kw}>pip</span> install statewave-openrouter{'\n'}
              <span style={kw}>cp</span> .env.example .env{'     '}
              <span style={dim}># set OPENROUTER_API_KEY and STATEWAVE_URL</span>
              {'\n'}
              <span style={kw}>uvicorn</span> statewave_openrouter:app --port{' '}
              <span style={str}>8080</span> --env-file .env
            </>
          ) : (
            <>
              <span style={kw}>docker</span> run --rm -p <span style={str}>8080:8080</span>{' '}
              --env-file .env \{'\n'}
              {'  '}ghcr.io/smaramwbc/statewave-openrouter:{VERSION}
            </>
          )}
        </pre>
      </Rise>

      <Rise className="mt-[18px]">
        <CodePanel label="verify" code={VERIFY_CMD}>
          <span style={kw}>curl</span> http://localhost:8080/health{'\n'}
          <span style={dim}>{'# {"status":"ok"}'}</span>
        </CodePanel>
      </Rise>

      <Rise className="mt-[18px] grid gap-[18px] lg:grid-cols-2">
        <CodePanel label="client.ts" code={CLIENT_TS}>
          <span style={attr}>const</span> <span style={txt}>client</span> ={' '}
          <span style={attr}>new</span> <span style={kw}>OpenAI</span>({'{'}
          {'\n  '}
          <span style={attr}>baseURL</span>:{' '}
          <span style={str}>&quot;http://localhost:8080/v1&quot;</span>,{'\n  '}
          <span style={attr}>apiKey</span>: process.env.
          <span style={txt}>OPENROUTER_API_KEY</span>,{'\n'}
          {'}'});{'\n\n'}
          <span style={attr}>await</span> <span style={txt}>client</span>
          .chat.completions.<span style={kw}>create</span>({'\n  '}
          {'{ '}
          <span style={attr}>model</span>: <span style={str}>&quot;openai/gpt-4o&quot;</span>,{' '}
          <span style={attr}>messages</span> {'}'},{'\n  '}
          {'{ '}
          <span style={attr}>headers</span>: {'{ '}
          <span style={str}>&quot;X-Statewave-Subject&quot;</span>:{' '}
          <span style={str}>&quot;user:42&quot;</span> {'} }'},{'\n'});
        </CodePanel>

        <div className={`${CARD} min-w-0 p-6`}>
          <Eyebrow>Before you put it in front of users</Eyebrow>
          <ul className="mt-4 flex list-none flex-col gap-3.5 p-0">
            <Bullet>
              Decide how subjects are trusted. A trusted header is right on a private
              network; anything public needs signed tokens.
            </Bullet>
            <Bullet>
              Pick subject ids that are stable for the life of the user, not per
              install or per device.
            </Bullet>
            <Bullet>
              Point your health check at <C>/health</C> and watch the log for context
              and episode failures, since neither one surfaces as a request error.
            </Bullet>
            <Bullet muted>
              Talking to Statewave directly instead of through the proxy? The{' '}
              <L to="/developers">Python and TypeScript SDKs</L> cover that path.
            </Bullet>
          </ul>
        </div>
      </Rise>
    </Band>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export function OpenRouterPage() {
  // JSON-LD for this route lives in lib/page-schema.ts so the prerenderer
  // emits it too; passing it here would reach the client only.
  usePageSEO()

  return (
    <div className="bg-surface-0">
      <HeroSection />
      <SectionNav sections={NAV_SECTIONS} label="Proxy documentation sections" />
      <DiffSection />
      <FlowSection />
      <EndpointsSection />
      <SubjectsSection />
      <AuthSection />
      <FailsOpenSection />
      <ConfigSection />
      <QuickStartSection />
      <PageFaq route="/openrouter" />
    </div>
  )
}
