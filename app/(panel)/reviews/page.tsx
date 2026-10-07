"use client";
import { useCallback, useEffect, useState } from "react";
import { api, prettyDate, toStr, type Review } from "@/lib/api";

const TABS = ["pending", "approved", "rejected"] as const;
type Tab = (typeof TABS)[number];

export default function ReviewsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setReviews(null);
    api<Review[]>(`/reviews?status=${tab}`).then(setReviews).catch((e) => setError(e.message));
  }, [tab]);
  useEffect(load, [load]);

  async function setStatus(id: string, status: Tab) {
    setError("");
    try {
      await api(`/reviews/${id}`, { method: "PATCH", body: { status } });
      setReviews((rs) => rs && rs.filter((r) => r._id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    try {
      await api(`/reviews/${id}`, { method: "DELETE" });
      setReviews((rs) => rs && rs.filter((r) => r._id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reviews</h1>
          <p className="sub">Approved reviews appear on the website. Nothing shows until you approve it.</p>
        </div>
      </div>
      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
      {reviews && reviews.length === 0 && <div className="card empty">No {tab} reviews.</div>}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {reviews?.map((r) => (
          <div key={r._id} className="card review">
            <div className="stars" aria-label={`${r.rating} stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
            <p>“{r.text}”</p>
            <div><b>{r.name}</b> <span className="sub">· {prettyDate(toStr(new Date(r.createdAt)))}</span></div>
            <div className="row">
              {tab !== "approved" && <button className="btn green sm" onClick={() => setStatus(r._id, "approved")}>Approve</button>}
              {tab !== "rejected" && <button className="btn ghost sm" onClick={() => setStatus(r._id, "rejected")}>Reject</button>}
              <button className="btn ghost sm" onClick={() => remove(r._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
