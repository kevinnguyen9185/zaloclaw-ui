import { ConfigSummaryCard } from "@/components/settings/ConfigSummaryCard";
import { ThemeSettingsPanel } from "@/components/settings/ThemeSettingsPanel";

export default function SettingsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-muted-foreground">
        Settings now read structured gateway config through a shared service.
      </p>
      <ThemeSettingsPanel />
      <ConfigSummaryCard />
    </section>
  );
}
