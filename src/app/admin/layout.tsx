import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "لوحة تحكم EYAS",
  robots: { index: false, follow: false },
};

// The admin panel is always dark, whatever theme the visitor chose on the public site.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-screen bg-[#0b1220]">
      {/* the whole page behind the panel is dark too (no light strip on phones) */}
      <style>{"html,body{background:#0b1220}"}</style>
      {children}
    </div>
  );
}
