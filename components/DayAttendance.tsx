"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, prettyDate, today } from "@/lib/api";

type Row = { _id: string; name: string; phone: string; vehicle: string; planDays: number; status: "present" | "absent" | null };

// Daily roll call: everyone whose plan covers the chosen date, mark present / absent.
export default function DayAttendance({ pickDate = true, initialDate }: { pickDate?: boolean; initialDate?: string }) {
  const [date, setDate] = useState(initialDate && initialDate <= today() ? initialDate : today());
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<{ members: Row[] }>(`/attendance/day?date=${date}`)
      .then((d) => setRows(d.members))
      .catch((e) => setError(e.message));
  }, [date]);
  useEffect(load, [load]);

  async function mark(id: string, status: "present" | "absent" | "clear") {
    setError("");
    try {
      await api(`/members/${id}/attendance`, { method: "PUT", body: { date, status } });
      setRows((rs) => rs && rs.map((r) => (r._id === id ? { ...r, status: status === "clear" ? null : status } : r)));
    } catch (e: any) {
      setError(e.message);
    }
  }

  const present = rows?.filter((r) => r.status === "present").length ?? 0;

  return (
    <div className="card">
      <div className="toolbar" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18 }}>{date === today() ? "Today" : prettyDate(date)}</h2>
          <div className="sub">{rows ? `${present} present of ${rows.length} learners` : "Loading…"}</div>
        </div>
        {pickDate && <input type="date" value={date} max={today()} onChange={(e) => e.target.value && e.target.value <= today() && setDate(e.target.value)} style={{ maxWidth: 170 }} />}
      </div>
      {error && <div className="error">{error}</div>}
      {rows && rows.length === 0 && <div className="empty">No learners have a plan running on this date.</div>}
      {rows && rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Training</th><th>Plan</th><th style={{ textAlign: "right" }}>Attendance</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td><Link href={`/members/${r._id}`}><b>{r.name}</b></Link><div className="sub" style={{ margin: 0 }}>{r.phone}</div></td>
                  <td style={{ textTransform: "capitalize" }}>{r.vehicle}</td>
                  <td>{r.planDays} days</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className={`btn sm ${r.status === "present" ? "green" : "ghost"}`} onClick={() => mark(r._id, r.status === "present" ? "clear" : "present")}>Present</button>{" "}
                    <button className={`btn sm ${r.status === "absent" ? "red" : "ghost"}`} onClick={() => mark(r._id, r.status === "absent" ? "clear" : "absent")}>Absent</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
