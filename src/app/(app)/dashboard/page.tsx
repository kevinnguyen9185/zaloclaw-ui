import { ActiveModelCard } from "@/components/dashboard/ActiveModelCard";
import { ZaloStatusCard } from "@/components/dashboard/ZaloStatusCard";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor your assistant connectivity and runtime configuration.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActiveModelCard />
        <ZaloStatusCard />
      </div>
    </section>
  );
}
