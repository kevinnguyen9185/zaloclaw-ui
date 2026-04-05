"use client";

import { useEffect, useRef } from "react";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { useLocalization } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { useDashboardChat } from "@/lib/dashboard/chat";

type DashboardAgentChatPanelProps = {
  className?: string;
  showMobileHeader?: boolean;
};

const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "input"],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    pre: [...(defaultSchema.attributes?.pre ?? []), "className"],
    input: ["type", "checked", "disabled"],
    table: [...(defaultSchema.attributes?.table ?? []), "className"],
    thead: [...(defaultSchema.attributes?.thead ?? []), "className"],
    th: [...(defaultSchema.attributes?.th ?? []), "align", "className"],
    td: [...(defaultSchema.attributes?.td ?? []), "align", "className"],
  },
};

export function DashboardAgentChatPanel({
  className,
  showMobileHeader = false,
}: DashboardAgentChatPanelProps) {
  const { t } = useLocalization();
  const {
    messages,
    draft,
    setDraft,
    isResponding,
    sendMessage,
    setMobileOpen,
    layoutMode,
    isConfigurationCollapsed,
    reopenConfiguration,
    botName,
  } = useDashboardChat();
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card/90 p-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/80",
        className
      )}
      aria-label={t("dashboard.chat.title")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className="font-heading text-base font-semibold text-foreground">
            {`${t("dashboard.chat.title")}: ${botName}`}
          </h3>
          <p className="text-xs text-muted-foreground">{`${t("dashboard.chat.subtitle")} ${botName}.`}</p>
          {layoutMode === "chat-focused" ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-primary/85">
              {t("dashboard.chat.modeChatFocused")}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          {layoutMode === "chat-focused" && isConfigurationCollapsed ? (
            <Button type="button" size="sm" variant="outline" onClick={reopenConfiguration}>
              {t("dashboard.identity.reopenConfig")}
            </Button>
          ) : null}
          {showMobileHeader ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setMobileOpen(false)}
            >
              {t("dashboard.chat.toggleClose")}
            </Button>
          ) : null}
        </div>
      </div>

      <div
        className="mt-3 max-h-72 min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border bg-background/70 p-3 lg:max-h-none"
        aria-live="polite"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[92%] rounded-md px-3 py-2 text-xs leading-relaxed",
              message.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted text-foreground [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-[15px] [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_strong]:font-semibold [&_em]:italic [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-foreground/90 [&_hr]:my-2 [&_hr]:border-border/60"
            )}
          >
            {message.role === "assistant" ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
                components={{
                  a: (props) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-medium underline underline-offset-2"
                    />
                  ),
                  code: ({ className: codeClassName, children, ...props }) => (
                    <code
                      {...props}
                      className={cn(
                        "rounded bg-background/70 px-1 py-0.5 font-mono text-[11px]",
                        codeClassName
                      )}
                    >
                      {children}
                    </code>
                  ),
                  pre: ({ className: preClassName, children, ...props }) => (
                    <pre
                      {...props}
                      className={cn(
                        "my-2 overflow-x-auto rounded-md border border-border/60 bg-background/80 p-2 text-[11px]",
                        preClassName
                      )}
                    >
                      {children}
                    </pre>
                  ),
                  table: ({ className: tableClassName, children, ...props }) => (
                    <div className="my-2 overflow-x-auto">
                      <table
                        {...props}
                        className={cn(
                          "w-full border-collapse border border-border/50 text-[11px]",
                          tableClassName
                        )}
                      >
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ className: headClassName, children, ...props }) => (
                    <thead {...props} className={cn("bg-background/70", headClassName)}>
                      {children}
                    </thead>
                  ),
                  th: ({ className: thClassName, children, ...props }) => (
                    <th
                      {...props}
                      className={cn(
                        "border border-border/50 px-2 py-1 text-left font-semibold",
                        thClassName
                      )}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ className: tdClassName, children, ...props }) => (
                    <td
                      {...props}
                      className={cn("border border-border/50 px-2 py-1 align-top", tdClassName)}
                    >
                      {children}
                    </td>
                  ),
                  input: ({ className: inputClassName, ...props }) => (
                    <input
                      {...props}
                      disabled
                      className={cn("mr-1.5 h-3.5 w-3.5 align-middle", inputClassName)}
                    />
                  ),
                  ul: ({ className: ulClassName, children, ...props }) => (
                    <ul {...props} className={cn("my-1 list-disc pl-4", ulClassName)}>
                      {children}
                    </ul>
                  ),
                  ol: ({ className: olClassName, children, ...props }) => (
                    <ol {...props} className={cn("my-1 list-decimal pl-4", olClassName)}>
                      {children}
                    </ol>
                  ),
                  li: ({ className: liClassName, children, ...props }) => (
                    <li {...props} className={cn("my-0.5", liClassName)}>
                      {children}
                    </li>
                  ),
                  p: ({ className: pClassName, children, ...props }) => (
                    <p {...props} className={cn("my-1", pClassName)}>
                      {children}
                    </p>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              message.content
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="mt-3 flex shrink-0 gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(draft);
        }}
      >
        <label className="sr-only" htmlFor="dashboard-agent-chat-input">
          {t("dashboard.chat.inputPlaceholder")}
        </label>
        <input
          id="dashboard-agent-chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
            placeholder={`${t("dashboard.chat.inputPlaceholder")} ${botName}`}
          disabled={isResponding}
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <Button type="submit" variant="outline" disabled={!draft.trim() || isResponding}>
          {isResponding ? t("dashboard.chat.waiting") : t("dashboard.chat.send")}
        </Button>
      </form>
      {isResponding ? (
        <p className="mt-2 shrink-0 text-xs text-muted-foreground">{t("dashboard.chat.waitingHint")}</p>
      ) : null}
    </aside>
  );
}
