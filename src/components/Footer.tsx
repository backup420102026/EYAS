import { Logo } from "./Logo";

const LINKS = [
  { href: "#challenges", label: "التحديات" },
  { href: "#roadmap", label: "خطة الموسم" },
  { href: "#awards", label: "الأوسمة" },
  { href: "#teams", label: "المشاركون والفرق" },
  { href: "#submit", label: "تسليم المشاريع" },
  { href: "#faq", label: "الأسئلة الشائعة" },
];

export function Footer() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE;

  return (
    <footer className="border-t border-line bg-surface2">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo />
            <p className="mt-5 max-w-sm text-[15px] leading-8 text-muted">
              منصة تمكّن الجيل القادم من العلماء والمبتكرين عبر مسابقات STEM التطبيقية في مصر.
            </p>
          </div>

          <div className="lg:col-span-3 lg:col-start-7">
            <h4 className="mb-4 text-base font-semibold text-ink">الأقسام</h4>
            <ul className="space-y-3 text-[15px] text-muted">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="transition-colors hover:text-ink">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="mb-4 text-base font-semibold text-ink">تواصل معنا</h4>
            <ul className="space-y-3 text-[15px] text-muted">
              {contactEmail && (
                <li>
                  <a href={`mailto:${contactEmail}`} className="hover:text-ink" dir="ltr">
                    {contactEmail}
                  </a>
                </li>
              )}
              {contactPhone && (
                <li>
                  <span dir="ltr">{contactPhone}</span>
                </li>
              )}
              <li>القاهرة، مصر</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6 text-sm text-muted">
          <span>
            © {new Date().getFullYear()} EYAS — الأكاديمية المصرية للعلوم. جميع الحقوق محفوظة.
          </span>
        </div>
      </div>
    </footer>
  );
}
