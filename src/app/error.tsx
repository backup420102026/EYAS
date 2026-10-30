"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center text-ink">
      <h1 className="font-display text-2xl font-extrabold">تعذّر تحميل الصفحة</h1>
      <p className="max-w-md text-sm text-muted">
        حدث خطأ أثناء الاتصال بقاعدة البيانات. تأكد من ضبط DATABASE_URL وتنفيذ الأمر{" "}
        <code dir="ltr">npm run db:push</code> ثم أعد المحاولة.
      </p>
      <button onClick={reset} className="btn-primary">
        إعادة المحاولة
      </button>
    </div>
  );
}
