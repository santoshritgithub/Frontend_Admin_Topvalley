"use client";
import { useEffect, useState } from "react";
import { api, type Pricing, VEHICLES, PLAN_KEYS } from "@/lib/api";

export default function PricingPage() {
  const [fees, setFees] = useState<Record<string, Record<string, string>> | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Pricing>("/pricing")
      .then((p) =>
        setFees(Object.fromEntries(VEHICLES.map((v) => [v, Object.fromEntries(PLAN_KEYS.map((k) => [k, String(p[v][k] || "")]))]))),
      )
      .catch((e) => setError(e.message));
  }, []);

  async function save() {
    if (!fees) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const body = Object.fromEntries(VEHICLES.map((v) => [v, Object.fromEntries(PLAN_KEYS.map((k) => [k, Number(fees[v][k]) || 0]))]));
      await api("/pricing", { method: "PUT", body });
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Pricing</h1>
          <p className="sub">Set the fee for each vehicle and plan. These appear automatically when you register a member.</p>
        </div>
        <button className="btn" onClick={save} disabled={busy || !fees}>{busy ? "Saving…" : "Save pricing"}</button>
      </div>
      {error && <div className="error">{error}</div>}
      {saved && <div className="error" style={{ background: "#dcfce7", color: "#166534" }}>Pricing saved. It applies to members registered from now on; existing members keep their fee.</div>}
      {fees && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr><th>Vehicle</th><th>7 day plan</th><th>15 day plan</th><th>30 day plan</th></tr>
            </thead>
            <tbody>
              {VEHICLES.map((v) => (
                <tr key={v}>
                  <td style={{ textTransform: "capitalize" }}><b>{v}</b></td>
                  {PLAN_KEYS.map((k) => (
                    <td key={k}>
                      <div className="fee" style={{ maxWidth: 170 }}>
                        <span>Rs</span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          inputMode="decimal"
                          aria-label={`${v} ${k.slice(1)} day fee`}
                          value={fees[v][k]}
                          onChange={(e) => {
                            setSaved(false);
                            setFees((cur) => cur && { ...cur, [v]: { ...cur[v], [k]: e.target.value } });
                          }}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
