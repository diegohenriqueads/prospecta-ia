import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";

export function Layout() {
  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
