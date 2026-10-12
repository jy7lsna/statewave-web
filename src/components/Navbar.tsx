import { Link, NavLink, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { formatCompactCount, useGithubStars } from '../lib/credibility-stats'
import { Icon } from './home/ui'
import { DOCS, GITHUB } from './home/links'

// Pricing is in the design but this site has no pricing page, so it is left out.
const links = [
  { to: '/product', label: 'Product' },
  { to: '/use-cases', label: 'Solutions' },
  { to: '/developers', label: 'Developers' },
  { to: '/why', label: 'Compare' },
  { to: '/blog', label: 'Resources' },
]

/**
 * Locks page scroll while the mobile drawer is open.
 *
 * Plain `overflow: hidden` on <html>/<body> works on Android but fails on
 * iOS Safari — the page underneath still scrolls when the user drags the
 * drawer. The trick that holds on every platform is to flip a data
 * attribute on <html> (the CSS in index.css does the actual locking)
 * AND remember the scroll offset so we can restore it on close. We also
 * reach for `position: fixed` on the body during the lock to defeat iOS's
 * momentum scrolling without losing the user's place.
 */
function lockBodyScroll() {
  const scrollY = window.scrollY
  document.documentElement.dataset.scrollLock = 'true'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.left = '0'
  document.body.style.right = '0'
  document.body.style.width = '100%'
  return scrollY
}

function unlockBodyScroll(scrollY: number) {
  document.documentElement.removeAttribute('data-scroll-lock')
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  window.scrollTo(0, scrollY)
}

export function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)
  const lockedScrollRef = useRef<number | null>(null)
  const stars = formatCompactCount(useGithubStars())

  // The home hero is dark, so the bar starts transparent there and becomes the
  // floating pill once the page scrolls (or the drawer is open).
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const clear = location.pathname === '/' && !scrolled && !mobileOpen

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen])

  // Body scroll lock + focus management while drawer is open. We move focus
  // to the close button so screen-reader and keyboard users land somewhere
  // sensible inside the drawer; on close we return focus to the toggle.
  useEffect(() => {
    if (!mobileOpen) return undefined
    // Capture the toggle node *before* the cleanup so React's exhaustive-
    // deps warning doesn't fire and so we don't dereference a ref that
    // could have been swapped on unmount.
    const toggleNode = toggleButtonRef.current
    lockedScrollRef.current = lockBodyScroll()
    const id = requestAnimationFrame(() => {
      drawerRef.current?.focus()
    })
    return () => {
      cancelAnimationFrame(id)
      if (lockedScrollRef.current !== null) {
        unlockBodyScroll(lockedScrollRef.current)
        lockedScrollRef.current = null
      }
      toggleNode?.focus()
    }
  }, [mobileOpen])

  // Close on route change
  const prevPathname = useRef(location.pathname)
  if (prevPathname.current !== location.pathname) {
    prevPathname.current = location.pathname
    if (mobileOpen) setMobileOpen(false)
  }

  return (
    <>
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sw-nav pt-safe pl-safe pr-safe"
      data-clear={clear || undefined}
    >
      <nav aria-label="Main navigation" className="sw-nav__bar">
        <Link to="/" className="sw-nav__logo" aria-label="Statewave home">
          <img src={clear ? '/brand/logo-horizontal-db.svg' : '/brand/logo-horizontal-lb.svg'} alt="Statewave" width={136} height={28} />
        </Link>

        <div className="sw-nav__links">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="sw-nav__link">{l.label}</NavLink>
          ))}
        </div>

        <div className="sw-nav__actions">
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="sw-nav__gh" aria-label="Statewave on GitHub">
            <Icon name="github" size={16} />
            {stars && <span className="sw-mono">★ {stars}</span>}
          </a>
          <a href={DOCS} target="_blank" rel="noopener noreferrer" className="sw-nav__cta">Get started</a>
        </div>

        {/* Mobile toggle — 44×44 tap target. -mr-2 keeps the icon visually
            aligned with the right edge while still meeting the tap-target
            minimum on either side. */}
        <button
          ref={toggleButtonRef}
          className="sw-nav__toggle w-11 h-11"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>
    </motion.header>

    {/* Mobile drawer — a full-height opaque sheet that occupies the entire
        viewport below the header. It MUST be rendered as a sibling of the
        animated header (not a child) — framer-motion applies a `transform`
        to the header which creates a CSS containing block, and a `fixed`
        descendant of a transformed element is positioned relative to that
        ancestor's box rather than the viewport. The header is only 60px
        tall, so a `bottom: 0` fixed child inside it would collapse to 0
        height. Lifting the drawer out of the header restores the viewport-
        relative positioning we actually want. */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              key="backdrop"
              data-testid="mobile-nav-backdrop"
              aria-label="Dismiss navigation menu"
              tabIndex={-1}
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="sw-nav__backdrop"
            />
            <motion.div
              key="drawer"
              ref={drawerRef}
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              tabIndex={-1}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="sw-nav__drawer pl-safe pr-safe"
            >
              <nav aria-label="Mobile navigation" className="sw-nav__drawer-in">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className="sw-nav__dlink"
                  >
                    {l.label}
                  </NavLink>
                ))}
                <a href={GITHUB} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="sw-nav__dlink">
                  GitHub{stars && <span className="sw-mono" style={{ marginLeft: 8, opacity: 0.7 }}>★ {stars}</span>}
                </a>
                <a href={DOCS} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="sw-nav__cta sw-nav__cta--block">
                  Get started
                </a>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
