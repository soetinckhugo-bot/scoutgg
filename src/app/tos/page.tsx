import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | LeagueScout",
  description: "Terms of Service for LeagueScout.",
};

export default function TosPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-text-muted hover:text-text-heading mb-12 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-text-heading mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-invert prose-sm max-w-none text-text-subtle">
          <p className="text-text-muted mb-8">Last updated: April 2026</p>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-text-heading mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using LeagueScout, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-text-heading mb-3">2. Description of Service</h2>
            <p>
              LeagueScout is a scouting and analytics platform for League of Legends esports.
              We provide player statistics, match history, and scouting tools for teams,
              scouts, and fans. Some features may require registration or a paid subscription.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-text-heading mb-3">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account
              credentials and for all activities that occur under your account.
              You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-text-heading mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to any part of the service</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Scrape, crawl, or otherwise extract data from the service without permission</li>
              <li>Use the service to harass, abuse, or harm others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-text-heading mb-3">5. Intellectual Property</h2>
            <p>
              All content, features, and functionality of LeagueScout are owned by us
              and are protected by international copyright, trademark, and other
              intellectual property laws. Game data and assets are property of
              Riot Games, Inc.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-text-heading mb-3">6. Disclaimer</h2>
            <p>
              LeagueScout is not endorsed by Riot Games and does not reflect the views
              or opinions of Riot Games or anyone officially involved in producing or
              managing League of Legends. League of Legends and Riot Games are trademarks
              or registered trademarks of Riot Games, Inc.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-text-heading mb-3">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, LeagueScout shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages
              arising out of or relating to your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-text-heading mb-3">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify
              users of any material changes by posting the new terms on this page.
              Your continued use of the service after such changes constitutes acceptance
              of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-text-heading mb-3">9. Contact</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:contact@LeagueScout.gg" className="text-primary-accent hover:underline">
                contact@LeagueScout.gg
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
