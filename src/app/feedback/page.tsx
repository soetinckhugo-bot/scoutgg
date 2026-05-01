import { PageTitle } from "@/components/ui/typography";
import { MessageSquare, Mail, ExternalLink } from "lucide-react";

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <MessageSquare className="h-12 w-12 text-primary-accent mx-auto mb-4" />
        <PageTitle className="text-text-heading mb-3">Feedback</PageTitle>
        <p className="text-text-body">
          Your opinion matters. Every feedback helps us improve LeagueScout.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-primary-accent border-b border-primary-accent/50">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Discord
            </h2>
          </div>
          <div className="p-4">
            <p className="text-text-body mb-3">
              Join our Discord community to share your ideas, report bugs, or just chat with the team.
            </p>
            <a
              href="https://discord.gg/leaguescout"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-accent hover:text-primary-accent/80 transition-colors font-medium"
            >
              Join Discord
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-primary-accent border-b border-primary-accent/50">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Email
            </h2>
          </div>
          <div className="p-4">
            <p className="text-text-body mb-3">
              Prefer email? Send us your feedback directly. Make sure to describe your feedback clearly in the subject line.
            </p>
            <a
              href="mailto:feedback@leaguescout.gg?subject=LeagueScout%20Feedback"
              className="inline-flex items-center gap-2 text-primary-accent hover:text-primary-accent/80 transition-colors font-medium"
            >
              <Mail className="h-4 w-4" />
              feedback@leaguescout.gg
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-text-muted text-center">
            We read every message. Thank you for helping us build a better scouting platform!
          </p>
        </div>
      </div>
    </div>
  );
}
