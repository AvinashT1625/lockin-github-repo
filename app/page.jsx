'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const electron = () =>
  typeof window !== 'undefined' ? window.electron ?? null : null;

// Tiny floating pop-up sizes (px) — the window hugs these exactly.
const SIZE = { setup: { w: 252, h: 168 }, run: { w: 200, h: 84 } };

const LINKEDIN_URL = 'https://www.linkedin.com/in/avinasht1625/';

function fmt(total) {
  total = Math.max(0, Math.floor(total));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p2 = (n) => String(n).padStart(2, '0');
  if (d) return `${d}d ${p2(h)}:${p2(m)}:${p2(s)}`;
  if (h) return `${p2(h)}:${p2(m)}:${p2(s)}`;
  return `${p2(m)}:${p2(s)}`;
}

/** Soft two-tone chime via Web Audio — no audio files needed. */
function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    [[660, 0], [880, 0.18]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  } catch {
    /* audio unavailable — stay silent */
  }
}

const parseUnit = (v) => Math.min(99, Math.max(0, parseInt(v || '0', 10) || 0));

function Unit({ label, value, onChange, onEnter }) {
  const step = (dir) => onChange(String(parseUnit(value) + dir));
  return (
    <div className="unit">
      <input
        type="number"
        value={value}
        min="0"
        max="99"
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
        onBlur={(e) => onChange(String(parseUnit(e.target.value)))}
        onFocus={(e) => e.target.select()}
        onWheel={(e) => step(e.deltaY < 0 ? 1 : -1)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter();
          if (e.key === 'ArrowUp') step(1);
          if (e.key === 'ArrowDown') step(-1);
        }}
        aria-label={label}
      />
      <span>{label}</span>
    </div>
  );
}

export default function Page() {
  const [view, setView] = useState('setup');
  const [units, setUnits] = useState({ d: '0', h: '0', m: '25', s: '0' });
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Focusing');
  const endRef = useRef(0);
  const viewRef = useRef(view);
  viewRef.current = view;

  // Keep the native window hugging the card's real rendered height.
  // The card remounts on every view switch (key={view}), so a
  // MutationObserver re-attaches the ResizeObserver to the fresh card and
  // re-reports. A delayed re-report covers any late layout settling.
  useEffect(() => {
    const api = electron();
    if (!api?.setSize) return;
    let ro = null;
    const report = () => {
      const el = document.querySelector('.app');
      if (!el) return;
      api.setSize(
        SIZE[viewRef.current].w,
        Math.ceil(el.getBoundingClientRect().height)
      );
    };
    const watchApp = () => {
      if (ro) ro.disconnect();
      const el = document.querySelector('.app');
      if (el) {
        ro = new ResizeObserver(report);
        ro.observe(el);
      }
      report();
      requestAnimationFrame(report);
      setTimeout(report, 250);
    };
    watchApp();
    if (document.fonts?.ready) document.fonts.ready.then(report);
    const mo = new MutationObserver(watchApp);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      if (ro) ro.disconnect();
    };
  }, []);

  const start = useCallback(() => {
    const t =
      parseUnit(units.d) * 86400 +
      parseUnit(units.h) * 3600 +
      parseUnit(units.m) * 60 +
      parseUnit(units.s);
    if (t <= 0) return;
    setTotal(t);
    setRemaining(t);
    endRef.current = Date.now() + t * 1000;
    setStatus('Focusing');
    setRunning(true);
    setView('run');
  }, [units]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        setStatus("Time's up");
        chime();
        setTimeout(() => setView('setup'), 3000);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const toggle = () => {
    if (status === "Time's up") return;
    if (running) {
      setRunning(false);
      setStatus('Paused');
    } else if (remaining > 0) {
      endRef.current = Date.now() + remaining * 1000;
      setRunning(true);
      setStatus('Focusing');
    }
  };

  const reset = () => {
    setRunning(false);
    setView('setup');
  };

  const setUnit = (k) => (v) => setUnits((u) => ({ ...u, [k]: v }));
  const frac = total > 0 ? remaining / total : 0;
  const time = fmt(remaining);
  const timeClass =
    'run-time ' + (time.length <= 5 ? 't5' : time.length <= 8 ? 't8' : 't11');

  return (
    <div className="app" key={view}>
      <div className="header drag">
        <span className="wordmark">LOCKIN</span>
        <button className="icon-btn" onClick={() => electron()?.close()} aria-label="Close">
          &#10005;
        </button>
      </div>

      {view === 'setup' ? (
        <>
          <div className="units">
            <Unit label="DAYS" value={units.d} onChange={setUnit('d')} onEnter={start} />
            <Unit label="HRS" value={units.h} onChange={setUnit('h')} onEnter={start} />
            <Unit label="MIN" value={units.m} onChange={setUnit('m')} onEnter={start} />
            <Unit label="SEC" value={units.s} onChange={setUnit('s')} onEnter={start} />
          </div>
          <button className="pill" onClick={start}>
            Start Focusing
          </button>
          <p className="hint">Drag to move &middot; Scroll a number to adjust</p>
          <p className="credit">
            Developed by{' '}
            <button
              className="credit-link"
              onClick={() => electron()?.openExternal(LINKEDIN_URL)}
            >
              Avinash T
            </button>
          </p>
        </>
      ) : (
        <>
          <div className="run drag">
            <div className={timeClass}>{time}</div>
            <div className="run-controls">
              <button
                className="ctl-btn"
                onClick={toggle}
                title={running ? 'Pause' : 'Resume'}
                aria-label={running ? 'Pause' : 'Resume'}
              >
                {running ? (
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
                    <rect x="3.2" y="2.6" width="3.1" height="10.8" rx="1.2" />
                    <rect x="9.7" y="2.6" width="3.1" height="10.8" rx="1.2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
                    <path d="M4.8 2.9v10.2c0 .8.9 1.3 1.6.9l7.4-5.1c.6-.4.6-1.4 0-1.8L6.4 2c-.7-.4-1.6.1-1.6.9z" />
                  </svg>
                )}
              </button>
              <button
                className="ctl-btn"
                onClick={reset}
                title="Reset"
                aria-label="Reset"
              >
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13.6 8a5.6 5.6 0 1 1-1.7-4" />
                  <path d="M13.6 1.8v3.4h-3.4" />
                </svg>
              </button>
            </div>
          </div>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${frac * 100}%` }} />
          </div>
        </>
      )}
    </div>
  );
}
