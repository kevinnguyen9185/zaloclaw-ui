import { ConfigSummaryCard } from "@/components/settings/ConfigSummaryCard";
import { ConnectionStatusPanel } from "@/components/settings/ConnectionStatusPanel";
import { ThemeSettingsPanel } from "@/components/settings/ThemeSettingsPanel";

export default function SettingsPage() {
  return (
    <section className="space-y-4 animate-card-enter">
      <ConnectionStatusPanel />
      <ThemeSettingsPanel />
      <ConfigSummaryCard />
    </section>
  );
}
