"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { api, money, today, type Member, type Pricing } from "@/lib/api";

const PLANS = [7, 15, 30] as const;

// Modal used both to register a new member and to edit an existing one.
// Fees are not typed here: they come from the Pricing page for the chosen vehicle and plan.
export default function MemberForm({
  member,
  onClose,
  onSaved,
}: {
  member?: Member;
  onClose: () => void;
  onSaved: (m: Member) => void;
}) {
  const [plan, setPlan] = useState<number>(member?.planDays ?? 7);
  const [vehicle, setVehicle] = useState<Member["vehicle"]>(member?.vehicle ?? "scooter");
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Pricing>("/pricing").then(setPricing).catch((e) => setError(e.message));
  }, []);

  // An existing member keeps the fee they were registered with unless vehicle or plan changes.
  const feeFor = (p: number) =>
    member && member.vehicle === vehicle && member.planDays === p ? member.amount : pricing?.[vehicle][`d${p}` as "d7"] ?? 0;
  const planFee = feeFor(plan);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      name: f.get("name"),
      phone: f.get("phone"),
      address: f.get("address"),
      vehicle,
      startDate: f.get("startDate"),
      notes: f.get("notes"),
      planDays: plan,
      amount: planFee,
      amountPaid: Number(f.get("amountPaid")) || 0,
    };
    setBusy(true);
    setError("");
    try {
      const saved = member
        ? await api<Member>(`/members/${member._id}`, { method: "PUT", body })
        : await api<Member>("/members", { method: "POST", body });
      onSaved(saved);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal wide" onSubmit={submit}>
        <h2>{member ? "Edit member" : "Register new member"}</h2>
        {error && <div className="error">{error}</div>}
        <div className="form-grid">
          <div>
            <label htmlFor="name">Full name *</label>
            <input id="name" name="name" required maxLength={80} defaultValue={member?.name} autoFocus />
          </div>
          <div>
            <label htmlFor="phone">Phone *</label>
            <input id="phone" name="phone" required maxLength={20} defaultValue={member?.phone} />
          </div>
          <div>
            <label htmlFor="vehicle">Training *</label>
            <select id="vehicle" name="vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value as Member["vehicle"])}>
              <option value="scooter">Scooter</option>
              <option value="bike">Bike</option>
              <option value="car">Car</option>
            </select>
          </div>
          <div>
            <label htmlFor="startDate">Start date *</label>
            <input id="startDate" name="startDate" type="date" required defaultValue={member?.startDate ?? today()} />
          </div>
          <div className="full">
            <label>Plan and fee *</label>
            <div className="plans">
              {PLANS.map((p) => (
                <div
                  key={p}
                  className={`plan ${plan === p ? "on" : ""}`}
                  onClick={() => setPlan(p)}
                  role="radio"
                  aria-checked={plan === p}
                  tabIndex={0}
                  onKeyDown={(e) => e.target === e.currentTarget && (e.key === "Enter" || e.key === " ") && setPlan(p)}
                >
                  <b>{p}</b>
                  <span>day plan</span>
                  <div className={`fee-amount ${feeFor(p) ? "" : "unset"}`}>{pricing ? (feeFor(p) ? money(feeFor(p)) : "Not set") : "…"}</div>
                </div>
              ))}
            </div>
            {pricing && !planFee && <div className="hint">No fee set for this plan yet. <Link href="/pricing">Set it on the Pricing page</Link>.</div>}
          </div>
          <div>
            <label htmlFor="amountPaid">Amount paid</label>
            <input id="amountPaid" name="amountPaid" type="number" min={0} step="any" inputMode="decimal" defaultValue={member?.amountPaid ?? 0} />
          </div>
          <div>
            <label>Plan fee</label>
            <input readOnly value={planFee ? money(planFee) : "—"} tabIndex={-1} />
          </div>
          <div>
            <label htmlFor="address">Address</label>
            <input id="address" name="address" maxLength={200} defaultValue={member?.address} />
          </div>
          <div>
            <label htmlFor="notes">Notes</label>
            <input id="notes" name="notes" maxLength={500} defaultValue={member?.notes} />
          </div>
        </div>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? "Saving…" : member ? "Save changes" : "Register"}</button>
        </div>
      </form>
    </div>
  );
}
