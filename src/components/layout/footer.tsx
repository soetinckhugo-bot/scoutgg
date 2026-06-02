import Link from "next/link";

const footerLinks = {
  Company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/pricing", label: "Pricing" },
    { href: "/scoring", label: "Scoring" },
    { href: "/feedback", label: "Feedback" },
  ],
  Legal: [
    { href: "/tos", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-text-heading">
                League<span className="text-text-heading">Scout</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-text-muted">
              Professional scouting platform for League of Legends. 
              Discover and analyze the next generation of talent with 
              data-driven insights and expert reports.
            </p>
            <div className="mt-6 flex items-center gap-4">
              {/* X / Twitter */}
              <a
                href="https://x.com/LeagueScoutHugo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-heading transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* YouTube */}
              <a
                href="https://youtube.com/@LeagueScout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-heading transition-colors"
                aria-label="YouTube"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-text-heading">
                {category}
              </h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted hover:text-text-heading transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} LeagueScout. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            LeagueScout is not endorsed by Riot Games.
          </p>
        </div>
      </div>
    </footer>
  );
}
