import { ActiveModelCard } from "@/components/dashboard/ActiveModelCard";
import { DashboardAgentChatPanel } from "@/components/dashboard/DashboardAgentChatPanel";
import { DataSkillsSection } from "@/components/dashboard/DataSkillsSection";
import { UseCaseLaunchpad } from "@/components/dashboard/UseCaseLaunchpad";
import { ZaloStatusCard } from "@/components/dashboard/ZaloStatusCard";

export default function DashboardPage() {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
      {/* Left column: status + configuration + use cases */}
      <section className="min-w-0 space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 animate-card-enter">
          <ActiveModelCard />
          <ZaloStatusCard />
        </div>
        <UseCaseLaunchpad />
        <DataSkillsSection />
      </section>

      {/* Right column: persistent chat — sticky and viewport-height on large screens */}
      <aside className="xl:sticky xl:top-6 xl:self-start xl:h-[calc(100dvh-8rem)]">
        <DashboardAgentChatPanel className="animate-card-enter-2 xl:flex xl:h-full xl:flex-col xl:overflow-hidden" />
      </aside>
    </div>
  );
}
