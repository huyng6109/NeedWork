import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/posts", label: "Kiểm duyệt bài" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/users", label: "Người dùng" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs bg-red-100 text-red-700 font-medium px-2 py-0.5 rounded-full">
          Admin
        </span>
        <h1 className="font-bold text-dark">Quản trị NeedWork</h1>
      </div>

      <nav className="flex gap-1 bg-surface rounded-xl p-1 border border-border overflow-x-auto">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-dark hover:bg-white whitespace-nowrap transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
