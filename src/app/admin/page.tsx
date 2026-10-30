"use client";

import { useCallback, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const [passcode, setPasscode] = useState<string | null>(null);
  const logout = useCallback(() => setPasscode(null), []);

  if (!passcode) {
    return <AdminGate onAuthenticated={setPasscode} />;
  }

  return <AdminDashboard passcode={passcode} onLogout={logout} />;
}
