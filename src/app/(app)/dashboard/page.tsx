import { ActiveModelCard } from "@/components/dashboard/ActiveModelCard";
import { UseCaseLaunchpad } from "@/components/dashboard/UseCaseLaunchpad";
import { ZaloStatusCard } from "@/components/dashboard/ZaloStatusCard";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 animate-card-enter">
        <ActiveModelCard />
        <ZaloStatusCard />
      </div>
      <UseCaseLaunchpad />
    </section>
  );
}
