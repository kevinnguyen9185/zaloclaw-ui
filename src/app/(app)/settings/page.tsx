import { ConfigSummaryCard } from "@/components/settings/ConfigSummaryCard";
import { ThemeSettingsPanel } from "@/components/settings/ThemeSettingsPanel";

export default function SettingsPage() {
  return (
    <section className="space-y-4 animate-card-enter">
      <ThemeSettingsPanel />
      <ConfigSummaryCard />
    </section>
  );
}
