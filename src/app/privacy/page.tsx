import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | LeagueScout",
  description: "Privacy Policy for LeagueScout.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0f1117]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-[#6C757D] hover:text-[#E9ECEF] mb-12 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-[#E9ECEF] mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-invert prose-sm max-w-none text-[#ADB5BD]">
          <p className="text-[#6C757D] mb-8">Last updated: April 2026</p>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#E9ECEF] mb-3">1. Information We Collect</h2>
            <p className="mb-3">
              We collect information you provide directly to us, such as when you create
              an account, subscribe to our newsletter, or contact us for support.
            </p>
            <p>This may include:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Email address and account credentials</li>
              <li>Payment information (processed securely by our payment provider)</li>
              <li>Any communications you send to us</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#E9ECEF] mb-3">2. Automatically Collected Information</h2>
            <p>
              When you use LeagueScout, we automatically collect certain information
              about your device and usage, including:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>IP address and browser type</li>
              <li>Pages visited and features used</li>
              <li>Device information and operating system</li>
              <li>Referring website or application</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#E9ECEF] mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#E9ECEF] mb-3">4. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our
              service and hold certain information. You can instruct your browser to refuse
              all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#E9ECEF] mb-3">5. Data Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to
              outside parties except as described in this policy. We may share information
              with trusted third-party service providers who assist us in operating our
              website and conducting our business.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#E9ECEF] mb-3">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect
              your personal information against unauthorized access, alteration, disclosure,
              or destruction. However, no method of transmission over the Internet is
              100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#E9ECEF] mb-3">7. Your Rights</h2>
            <p>
              Depending on your location, you may have the right to access, correct, delete,
              or restrict processing of your personal information. To exercise these rights,
              please contact us at{" "}
              <a href="mailto:contact@LeagueScout.gg" className="text-[#E94560] hover:underline">
                contact@LeagueScout.gg
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#E9ECEF] mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of
              any changes by posting the new policy on this page and updating the
              &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#E9ECEF] mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:contact@LeagueScout.gg" className="text-[#E94560] hover:underline">
                contact@LeagueScout.gg
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
