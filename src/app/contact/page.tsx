import Link from "next/link";
import { Mail, ArrowLeft, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | LeagueScout",
  description: "Get in touch with LeagueScout. Questions, feedback, or just want to say hello?",
  openGraph: {
    title: "Contact | LeagueScout",
    description: "Get in touch with LeagueScout.",
    type: "website",
  },
};

const contactLinks = [
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    label: "@LeagueScoutHugo",
    description: "Follow us on X",
    href: "https://x.com/LeagueScoutHugo",
    external: true,
  },
  {
    icon: <Mail className="h-5 w-5" />,
    label: "contact@LeagueScout.gg",
    description: "Email us anytime",
    href: "mailto:contact@LeagueScout.gg",
    external: false,
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    label: "Hugo_____",
    description: "Chat on Discord",
    href: "https://discord.com/users/Hugo_____",
    external: true,
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    label: "LeagueScout",
    description: "Watch on YouTube",
    href: "https://youtube.com/@LeagueScout",
    external: true,
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-text-muted hover:text-text-heading mb-12 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        {/* Logo + Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-accent flex items-center justify-center">
              <span className="text-text-heading font-bold text-lg">L</span>
            </div>
            <span className="text-2xl font-bold text-text-heading">LeagueScout</span>
          </div>
          <h1 className="text-3xl font-bold text-text-heading mb-4">
            Get in touch
          </h1>
          <p className="text-text-muted max-w-md mx-auto leading-relaxed">
            Have questions, feedback, or just want to say hello? We&apos;d love to
            hear from you. We&apos;re always here to listen and will get back to you
            as quickly as we can.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {contactLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="group rounded-xl border border-border bg-surface-hover p-6 text-center hover:border-border-hover hover:bg-surface-hover transition-all"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-text-subtle group-hover:text-text-heading transition-colors">
                {link.icon}
              </div>
              <div className="text-sm font-semibold text-text-heading mb-1">
                {link.label}
              </div>
              <div className="text-xs text-text-muted">
                {link.description}
              </div>
            </a>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 flex items-center justify-center gap-6 text-xs text-text-muted">
          <Link href="/tos" className="hover:text-text-heading transition-colors">
            Terms of Service
          </Link>
          <span className="text-border">|</span>
          <Link href="/privacy" className="hover:text-text-heading transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
