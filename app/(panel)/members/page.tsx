"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, money, prettyDate, type Member } from "@/lib/api";
import MemberForm from "@/components/MemberForm";

const FILTERS = ["all", "active", "upcoming", "completed", "due"] as const;
type Filter = (typeof FILTERS)[number];
const STATUS_PILL = { active: "green", upcoming: "amber", completed: "gray" } as const;

function Members() {
  const router = useRouter();
  const params = useSearchParams();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("active");
  const [adding, setAdding] = useState(params.get("new") === "1");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<Member[]>(`/members?q=${encodeURIComponent(q)}`)
      .then(setMembers)
      .catch((e) => setError(e.message));
  }, [q]);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const matches = (m: Member, f: Filter) => (f === "all" ? true : f === "due" ? m.due > 0 : m.status === f);
  const visible = members?.filter((m) => matches(m, filter));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Members</h1>
          <p className="sub">Click a member to see their plan and attendance.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/pricing" className="btn ghost">Set price</Link>
          <button className="btn" onClick={() => setAdding(true)}>+ Register member</button>
        </div>
      </div>
      <div className="toolbar">
        <input type="search" placeholder="Search by name or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="tabs">
          {FILTERS.map((f) => (
            <button key={f} className={`tab ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>
              {f === "due" ? "Payment due" : f}{members ? ` (${members.filter((m) => matches(m, f)).length})` : ""}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="card" style={{ padding: 8 }}>
        {visible && visible.length === 0 && <div className="empty">{q || filter !== "all" ? "No members match this filter." : "No members yet. Register your first one."}</div>}
        {visible && visible.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Training</th><th>Plan</th><th>Dates</th><th>Attended</th><th>Status</th><th>Due</th></tr></thead>
              <tbody>
                {visible.map((m) => (
                  <tr key={m._id} className="click" onClick={() => router.push(`/members/${m._id}`)}>
                    <td><b>{m.name}</b><div className="sub" style={{ margin: 0 }}>{m.phone}</div></td>
                    <td style={{ textTransform: "capitalize" }}>{m.vehicle}</td>
                    <td><span className="pill">{m.planDays} days</span></td>
                    <td>{prettyDate(m.startDate)} – {prettyDate(m.endDate)}</td>
                    <td>{m.presentCount} / {m.planDays}</td>
                    <td><span className={`pill ${STATUS_PILL[m.status!]}`}>{m.status}</span></td>
                    <td>{m.due > 0 ? <span className="pill red">{money(m.due)}</span> : <span className="sub">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!members && !error && <div className="empty">Loading…</div>}
      </div>
      {adding && (
        <MemberForm
          onClose={() => setAdding(false)}
          onSaved={(m) => router.push(`/members/${m._id}`)}
        />
      )}
    </>
  );
}

export default function MembersPage() {
  return (
    <Suspense>
      <Members />
    </Suspense>
  );
}
