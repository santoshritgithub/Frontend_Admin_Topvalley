"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { addDays, api, money, prettyDate, today, weekday, type Member } from "@/lib/api";
import MemberForm from "@/components/MemberForm";

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [m, setM] = useState<Member | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<Member>(`/members/${id}`).then(setM).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  async function mark(date: string, status: "present" | "absent" | "clear") {
    setError("");
    try {
      await api(`/members/${id}/attendance`, { method: "PUT", body: { date, status } });
      setM((cur) => {
        if (!cur) return cur;
        const rest = (cur.attendance || []).filter((a) => a.date !== date);
        return { ...cur, attendance: status === "clear" ? rest : [...rest, { date, status }] };
      });
    } catch (e: any) {
      setError(e.message);
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

  const marks = new Map((m.attendance || []).map((a) => [a.date, a.status]));
  const days = Array.from({ length: m.planDays }, (_, i) => addDays(m.startDate, i));
  const present = [...marks.values()].filter((s) => s === "present").length;
  const absent = [...marks.values()].filter((s) => s === "absent").length;
  const t = today();
  const elapsed = days.filter((d) => d <= t).length;
  const remaining = Math.max(0, m.planDays - elapsed);

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
          {prettyDate(m.startDate)} → {prettyDate(m.endDate)}
          {t < m.startDate ? " · starts soon" : remaining === 0 ? " · plan completed" : ` · ${remaining} day${remaining === 1 ? "" : "s"} left`}
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
        <h3 style={{ marginBottom: 14 }}>Attendance</h3>
        <div className="days">
          {days.map((d, i) => {
            const s = marks.get(d);
            const future = d > t;
            return (
              <div key={d} className={`day ${s || ""} ${d === t ? "today" : ""} ${future ? "future" : ""}`}>
                <div>
                  <div className="n">Day {i + 1} · {weekday(d)}</div>
                  <div className="d">{prettyDate(d).replace(/,? \d{4}$/, "")}</div>
                </div>
                <div className="marks">
                  <button className={`p ${s === "present" ? "on" : ""}`} title={future ? "Cannot mark a future date" : "Present"} disabled={future} onClick={() => mark(d, s === "present" ? "clear" : "present")}>P</button>
                  <button className={`a ${s === "absent" ? "on" : ""}`} title={future ? "Cannot mark a future date" : "Absent"} disabled={future} onClick={() => mark(d, s === "absent" ? "clear" : "absent")}>A</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
