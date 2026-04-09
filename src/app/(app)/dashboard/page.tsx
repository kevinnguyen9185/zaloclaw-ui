import { DashboardAgentChatPanel } from "@/components/dashboard/DashboardAgentChatPanel";
import { DashboardCronJobsSection } from "@/components/dashboard/DashboardCronJobsSection";
import { DashboardOperatorCommandSection } from "@/components/dashboard/DashboardOperatorCommandSection";
import { DataSkillsSection } from "@/components/dashboard/DataSkillsSection";
import { UseCaseLaunchpad } from "@/components/dashboard/UseCaseLaunchpad";

export default function DashboardPage() {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
      {/* Left column: Lean Ops primary sections */}
      <section className="min-w-0 space-y-5">
        <div id="section-use-cases">
          <UseCaseLaunchpad />
        </div>
        <div id="section-agent-skills">
          <DataSkillsSection />
        </div>
        <div id="section-cron-jobs">
          <DashboardCronJobsSection />
        </div>
        <div id="section-operator-command">
          <DashboardOperatorCommandSection />
        </div>
      </section>

      {/* Right column: persistent chat — sticky and viewport-height on large screens */}
      <aside className="xl:sticky xl:top-6 xl:self-start xl:h-[calc(100dvh-8rem)]">
        <DashboardAgentChatPanel className="animate-card-enter-2 xl:flex xl:h-full xl:flex-col xl:overflow-hidden" />
      </aside>
    </div>
  );
}
