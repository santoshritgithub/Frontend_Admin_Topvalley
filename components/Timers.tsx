"use client";
import { useEffect, useState } from "react";
import type { Ride } from "@/lib/api";

export const SESSION_MS = 30 * 60 * 1000;

export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// State of one 30-minute ride at time `now`.
export function rideState(r: { startedAt: string; endsAt?: string; pausedLeft?: number | null }, now: number) {
  const start = new Date(r.startedAt).getTime();
  const end = r.endsAt ? new Date(r.endsAt).getTime() : start + SESSION_MS;
  if (r.pausedLeft != null) return { kind: "paused" as const, left: r.pausedLeft };
  if (start > now) return { kind: "queued" as const, left: SESSION_MS };
  if (end <= now) return { kind: "done" as const, left: 0 };
  return { kind: "running" as const, left: end - now };
}

export const mmss = (ms: number) =>
  `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

// One pill per "Present" mark: start time + 30-minute countdown (queued / paused shown too).
export default function Timers({ sessions, compact = false, onToggle }: { sessions?: Ride[]; compact?: boolean; onToggle?: (r: Ride, action: "pause" | "resume") => void }) {
  const now = useNow();
  if (!sessions || sessions.length === 0) return <span className="sub">-</span>;
  if (compact) {
    // One pill for the ride that matters now, plus counts for the rest.
    const states = sessions.map((r) => ({ r, s: rideState(r, now) }));
    const cur = states.find((x) => x.s.kind === "running" || x.s.kind === "paused") ?? states.find((x) => x.s.kind === "queued");
    const done = states.filter((x) => x.s.kind === "done").length;
    const queued = states.filter((x) => x.s.kind === "queued" && x !== cur).length;
    return (
      <div className="timer-sum">
        {cur ? (
          onToggle && (cur.s.kind === "running" || cur.s.kind === "paused") ? (
            <button
              type="button"
              className={`timer ${cur.s.kind} clickable`}
              title={cur.s.kind === "running" ? "Click to pause" : "Click to resume"}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(cur.r, cur.s.kind === "running" ? "pause" : "resume");
              }}
            >
              {cur.s.kind === "paused" ? "▶ Paused" : "⏸ Running"} · <b>{mmss(cur.s.left)}</b>
            </button>
          ) : (
            <span className={`timer ${cur.s.kind}`}>
              {cur.s.kind === "paused" ? "Paused" : cur.s.kind === "queued" ? "Next" : "Running"} · <b>{mmss(cur.s.left)}</b>
            </span>
          )
        ) : (
          <span className="timer done">All done</span>
        )}
        <span className="sub">{done} done{queued ? ` · ${queued} queued` : ""}</span>
      </div>
    );
  }
  return (
    <div className="timers">
      {sessions.map((r) => {
        const s = rideState(r, now);
        return (
          <span key={r.startedAt} className={`timer ${s.kind === "done" ? "done" : ""} ${s.kind === "queued" ? "queued" : ""} ${s.kind === "paused" ? "paused" : ""}`}>
            {clock(r.startedAt)} · <b>{s.kind === "done" ? "Done" : s.kind === "queued" ? `Queued ${mmss(s.left)}` : s.kind === "paused" ? `Paused ${mmss(s.left)}` : mmss(s.left)}</b>
          </span>
        );
      })}
    </div>
  );
}
