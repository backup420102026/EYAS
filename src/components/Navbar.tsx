"use client";

import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "#challenges", label: "التحديات" },
  { href: "#roadmap", label: "خطة الموسم" },
  { href: "#awards", label: "الأوسمة" },
  { href: "#teams", label: "المشاركون والفرق" },
  { href: "#submit", label: "التسليم" },
];

export function Navbar({
  onRegisterClick,
  registrationOpen,
}: {
  onRegisterClick: () => void;
  registrationOpen: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const first = setTimeout(onScroll, 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(first);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Opaque once the page moves (or the mobile menu is open): nothing shows through it.
  const solid = scrolled || open;
  const themeLabel = theme === "dark" ? "التبديل إلى المظهر الفاتح" : "التبديل إلى المظهر الداكن";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors ${
        solid ? "border-line bg-bg" : "border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="التنقل الرئيسي"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8"
      >
        <a href="#top" aria-label="EYAS — الصفحة الرئيسية" className="shrink-0">
          <Logo />
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-muted transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={toggleTheme}
            aria-label={themeLabel}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong bg-surface text-ink transition-colors hover:bg-surface2"
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          <button onClick={onRegisterClick} disabled={!registrationOpen} className="btn-primary">
            {registrationOpen ? "سجّل الآن" : "التسجيل مغلق"}
          </button>
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong bg-surface text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-bg lg:hidden">
          <div className="mx-auto max-w-7xl px-4 pb-5 sm:px-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block border-b border-line py-3.5 text-base font-medium text-ink"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  setOpen(false);
                  onRegisterClick();
                }}
                disabled={!registrationOpen}
                className="btn-primary flex-1"
              >
                {registrationOpen ? "سجّل الآن" : "التسجيل مغلق"}
              </button>
              <button
                onClick={toggleTheme}
                aria-label={themeLabel}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong bg-surface text-ink"
              >
                {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
