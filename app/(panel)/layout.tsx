"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, clearToken, getToken, type Review } from "@/lib/api";

const LINKS = [
  ["/dashboard", "Dashboard"],
  ["/members", "Members"],
  ["/attendance", "Attendance"],
  ["/notifications", "Notifications"],
  ["/reviews", "Reviews"],
  ["/pricing", "Pricing"],
] as const;

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(0);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  // Refresh the pending-review badge whenever the user navigates.
  useEffect(() => {
    if (!ready) return;
    api<Review[]>("/reviews?status=pending").then((r) => setPending(r.length)).catch(() => {});
    api<{ unread: number }>("/notifications").then((d) => setUnread(d.unread)).catch(() => {});
  }, [ready, path]);

  if (!ready) return null;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Top Valley<small>Admin panel</small></div>
        <nav className="nav">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className={path.startsWith(href) ? "active" : ""}>
              {label}
              {href === "/reviews" && pending > 0 && <span className="badge">{pending}</span>}
              {href === "/notifications" && unread > 0 && <span className="badge">{unread}</span>}
            </Link>
          ))}
        </nav>
        <div className="spacer" />
        <button
          className="btn ghost sm"
          onClick={() => {
            clearToken();
            router.replace("/login");
          }}
        >
          Log out
        </button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
