"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Member, type Review } from "@/lib/api";
import DayAttendance from "@/components/DayAttendance";

export default function Dashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pending, setPending] = useState<Review[]>([]);

  useEffect(() => {
    api<Member[]>("/members").then(setMembers).catch(() => {});
    api<Review[]>("/reviews?status=pending").then(setPending).catch(() => {});
  }, []);

  const active = members.filter((m) => m.status === "active").length;
  const upcoming = members.filter((m) => m.status === "upcoming").length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="sub">Today at Top Valley Driving Center.</p>
        </div>
        <Link href="/members?new=1" className="btn">+ Register member</Link>
      </div>
      <div className="grid stats">
        <div className="card stat"><b>{members.length}</b><span>Total members</span></div>
        <div className="card stat"><b>{active}</b><span>Active plans</span></div>
        <div className="card stat"><b>{upcoming}</b><span>Starting soon</span></div>
        <Link href="/reviews" className="card stat"><b>{pending.length}</b><span>Reviews awaiting approval</span></Link>
      </div>
      <DayAttendance pickDate={false} />
    </>
  );
}
