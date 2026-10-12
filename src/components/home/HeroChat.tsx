import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useChatWidget } from '../../lib/widget-context-api'
import type { DocSource } from '../../lib/widget-context-api'
import { MarkdownMessage } from '../chat/MarkdownMessage'
import { safeUrl } from '../chat/safe-url'
import { SUGGESTIONS } from '../chat/suggestions'

const ROUNDS = SUGGESTIONS['statewave-support']

function Sources({ sources }: { sources: DocSource[] }) {
  return (
    <div className="sw-chat__sources">
      <span>Sources</span>
      {sources.map((s) => {
        const safe = safeUrl(s.url)
        const label = s.breadcrumb || s.doc_path
        return safe ? (
          <a key={s.doc_path} href={safe} target="_blank" rel="noopener noreferrer" title={s.breadcrumb}>{label}</a>
        ) : (
          <em key={s.doc_path}>{label}</em>
        )
      })}
    </div>
  )
}

/** The real Statewave Support agent (the docs-grounded persona from the demo
 *  widget), embedded in the hero. Shares conversation state with the floating
 *  widget, so a chat started here carries on there. */
export function HeroChat() {
  const { statewaveMessages, isLoading, sendMessage, retryLast, clearChat, enterSupportChannel } = useChatWidget()
  const [text, setText] = useState('')
  const [round, setRound] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => { enterSupportChannel() }, [enterSupportChannel])

  // Keep the newest message in view without scrolling the whole page.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [statewaveMessages.length, isLoading])

  const send = (raw: string) => {
    const t = raw.trim()
    if (!t || isLoading) return
    setText('')
    void sendMessage(t)
  }
  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(text) }
  const pick = (t: string) => { send(t); setRound((r) => (r + 1) % ROUNDS.length) }
  const last = statewaveMessages[statewaveMessages.length - 1]
  const empty = statewaveMessages.length === 0

  return (
    <div className="sw-chat">
      <div className="sw-chat__head">
        <span className="sw-chat__brand">
          <span className="sw-chat__logo"><img src="/brand/icon.svg" alt="" width={20} height={20} /></span>
          <span>
            <b>Statewave Support</b>
          </span>
        </span>
        {!empty && <button type="button" className="sw-chat__clear" onClick={clearChat}>New chat</button>}
      </div>

      <div className="sw-chat__body" ref={scroller} role="log" aria-live="polite" aria-label="Chat with Statewave Support">
        {empty ? (
          <div className="sw-chat__empty">
            <span className="sw-chat__icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>
            </span>
            <h3>Ask the Statewave docs</h3>
            <p>Setup, deployment, privacy or compiler questions. Every answer comes from the docs memory pack and cites its source. When something isn't covered, the agent says so.</p>
            <ul>
              <li><b>Cited</b>every claim</li>
              <li><b>Grounded</b>official docs</li>
              <li><b>Honest</b>about gaps</li>
            </ul>
          </div>
        ) : (
          statewaveMessages.map((m, i) => (
            <div key={`${m.timestamp}-${i}`} className={`sw-chat__msg sw-chat__msg--${m.role}${m.error ? ' is-error' : ''}`}>
              <div className="sw-chat__bubble">
                {m.role === 'user' ? m.content : <div className="sw-chat__md"><MarkdownMessage content={m.content} /></div>}
              </div>
              {m.error && i === statewaveMessages.length - 1 && (
                <button type="button" className="sw-chat__retry" onClick={() => void retryLast()}>Retry</button>
              )}
              {m.sources && m.sources.length > 0 && <Sources sources={m.sources} />}
            </div>
          ))
        )}
        {isLoading && (
          <div className="sw-chat__msg sw-chat__msg--assistant" aria-label="Statewave Support is typing">
            <div className="sw-chat__bubble sw-chat__typing"><i /><i /><i /></div>
          </div>
        )}
      </div>

      <div className="sw-chat__foot">
        <div className="sw-chat__chips">
          {ROUNDS[round].map((s) => (
            <button key={s.text} type="button" className="sw-qchip" disabled={isLoading} onClick={() => pick(s.text)}>{s.text}</button>
          ))}
        </div>
        <form className="sw-chat__form" onSubmit={onSubmit}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask something…"
            aria-label="Ask Statewave Support"
            maxLength={500}
            autoComplete="off"
          />
          <button type="submit" className="sw-send" disabled={isLoading || !text.trim()} aria-label="Send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
        </form>
        {last?.error && <p className="sw-chat__note">Something went wrong. Try again.</p>}
      </div>
    </div>
  )
}
