"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, money, prettyDate, today, type Member } from "@/lib/api";
import MemberForm from "@/components/MemberForm";
import AlertModal from "@/components/AlertModal";
import Timers, { rideState, useNow } from "@/components/Timers";

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [m, setM] = useState<Member | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState("");
  // Payment-block messages open as a pop-up; everything else stays inline.
  const fail = (e: any) => (/^Allowed \d+ days/.test(e.message) ? setPopup(e.message) : setError(e.message));
  const now = useNow();
  const load = useCallback(() => {
    api<Member>(`/members/${id}`).then(setM).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  async function mark(i: number, status: "present" | "absent" | "clear") {
    setError("");
    try {
      await api(`/members/${id}/slots/${i}`, { method: "PUT", body: { status } });
      load();
    } catch (e: any) {
      fail(e);
    }
  }

  async function timer(i: number, action: "pause" | "resume") {
    setError("");
    try {
      await api(`/members/${id}/slots/${i}/timer`, { method: "PUT", body: { action } });
      load();
    } catch (e: any) {
      fail(e);
    }
  }

  async function remove() {
    if (!m || !confirm(`Delete ${m.name} and all of their attendance? This cannot be undone.`)) return;
    try {
      await api(`/members/${id}`, { method: "DELETE" });
      router.replace("/members");
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (error && !m) return <div className="error">{error}</div>;
  if (!m) return <div className="empty">Loading…</div>;

  const t = today();
  const slot = (i: number) => (m.slots || []).find((x) => x.i === i);
  const present = (m.slots || []).filter((x) => x.status === "present").length;
  const absent = (m.slots || []).filter((x) => x.status === "absent").length;
  // A box is used up when its 30-min ride finishes, or when it is marked absent.
  const used = (m.slots || []).filter((x) => x.status === "absent" || (x.startedAt && rideState(x as any, now).kind === "done")).length;
  const remaining = Math.max(0, m.planDays - used);

  return (
    <>
      <p style={{ marginTop: 0 }}><Link href="/members" className="sub">← All members</Link></p>
      <div className="page-head">
        <div>
          <h1>{m.name}</h1>
          <p className="sub" style={{ textTransform: "capitalize" }}>{m.vehicle} training · {m.phone}{m.address && ` · ${m.address}`}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn red" onClick={remove}>Delete</button>
        </div>
      </div>
      {error && <div className="error">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Plan</h3>
        <div className="plans" style={{ marginBottom: 14 }}>
          {[7, 15, 30].map((p) => (
            <div key={p} className={`plan ${m.planDays === p ? "on" : ""}`}>
              <b>{p}</b><span>day plan</span>
            </div>
          ))}
        </div>
        <div className="sub">
          Started {prettyDate(m.startDate)}
          {t < m.startDate ? " · starts soon" : remaining === 0 ? " · plan completed" : ` · ${remaining} day${remaining === 1 ? "" : "s"} left`}
          {" "}· {used} of {m.planDays} days used (each finished 30-min ride or absent = 1 day)
          {m.graceDays && m.due > 0 ? <> · {m.due.toLocaleString()} unpaid: pay within {m.graceDays} day{m.graceDays === 1 ? "" : "s"}</> : null}
        </div>
        <div className="progress"><div style={{ width: `${(present / m.planDays) * 100}%` }} /></div>
        <div className="sub"><b style={{ color: "var(--green)" }}>{present} present</b> · <b style={{ color: "var(--red)" }}>{absent} absent</b> · {m.planDays - present - absent} unmarked</div>
        <div className="fees">
          <div><span>Plan fee</span><b>{money(m.amount)}</b></div>
          <div><span>Paid</span><b style={{ color: "var(--green)" }}>{money(m.amountPaid)}</b></div>
          <div><span>Due</span><b style={{ color: m.due > 0 ? "var(--red)" : "var(--green)" }}>{m.due > 0 ? money(m.due) : "Cleared"}</b></div>
        </div>
        {m.notes && <p style={{ marginBottom: 0 }}><b>Notes:</b> {m.notes}</p>}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14 }}>Attendance · {m.planDays} days</h3>
        <div className="days boxes">
          {Array.from({ length: m.planDays }, (_, i) => {
            const x = slot(i);
            const locked = x?.status === "present" && !!x.startedAt && rideState(x as any, now).kind === "done"; // finished rides cannot be edited
            return (
              <div key={i} className={`day ${x?.status || ""}`}>
                <div className="n">Day {i + 1}</div>
                <div className="marks">
                  <button disabled={locked} title={locked ? "Finished - locked" : undefined} className={`p ${x?.status === "present" ? "on" : ""}`} onClick={() => mark(i, x?.status === "present" ? "clear" : "present")}>Present</button>
                  <button disabled={locked} title={locked ? "Finished - locked" : undefined} className={`a ${x?.status === "absent" ? "on" : ""}`} onClick={() => mark(i, x?.status === "absent" ? "clear" : "absent")}>Absent</button>
                </div>
                <div className="slot-state">
                  {x?.status === "present" && x.startedAt ? (
                    <>
                      <div className="slot-date">{new Date(x.startedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</div>
                      <Timers sessions={[{ startedAt: x.startedAt, endsAt: x.endsAt ?? "", pausedLeft: x.pausedLeft ?? null }]} />
                      {(() => {
                        const k = rideState(x as any, now).kind;
                        return k === "running" ? (
                          <button className="btn sm ghost" onClick={() => timer(i, "pause")}>Pause</button>
                        ) : k === "paused" ? (
                          <button className="btn sm" onClick={() => timer(i, "resume")}>Resume</button>
                        ) : null;
                      })()}
                    </>
                  ) : x?.status === "present" ? null : x?.status === "absent" ? <span className="sub">Absent</span> : <span className="sub">Not marked</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {popup && <AlertModal message={popup} onClose={() => setPopup("")} />}
      {editing && (
        <MemberForm
          member={m}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </>
  );
}
