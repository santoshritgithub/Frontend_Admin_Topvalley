"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, prettyDate, type AppNotification } from "@/lib/api";

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<{ items: AppNotification[]; unread: number }>("/notifications")
      .then((d) => {
        setItems(d.items);
        setUnread(d.unread);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function markAll() {
    await api("/notifications/read-all", { method: "PATCH" }).catch((e) => setError(e.message));
    load();
  }

  async function markOne(id: string) {
    await api(`/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Notifications</h1>
          <p className="sub">Every day at 5 PM we check who has no attendance marked. Marking them clears the alert.</p>
        </div>
        <button className="btn ghost" onClick={markAll} disabled={!unread}>Mark all as read</button>
      </div>
      {error && <div className="error">{error}</div>}
      {items && items.length === 0 && <div className="card empty">All caught up. No missed attendance.</div>}
      <div className="grid">
        {items?.map((n) => (
          <div key={n._id} className={`card notif ${n.read ? "" : "unread"}`}>
            <div>
              <b>{n.memberName}</b>: attendance not marked
              <div className="sub" style={{ marginTop: 2 }}>{prettyDate(n.date)}</div>
            </div>
            <div className="row">
              <Link href={`/attendance?date=${n.date}`} className="btn sm" onClick={() => markOne(n._id)}>Mark attendance</Link>
              <Link href={`/members/${n.member}`} className="btn ghost sm" onClick={() => markOne(n._id)}>View member</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
