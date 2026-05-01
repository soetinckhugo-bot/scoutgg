import { Metadata } from "next";
import { PageTitle, SectionHeader } from "@/components/ui/typography";
import { BarChart3, Target, TrendingUp, Users, Eye, Trophy, Clock, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Scoring Methodology | LeagueScout",
  description: "How LeagueScout evaluates player performance and potential across multiple dimensions.",
};

export default function ScoringPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <PageTitle className="text-text-heading mb-4">Our Scoring Methodology</PageTitle>
        <p className="text-text-body mb-10">
          LeagueScout uses a multi-dimensional approach to evaluate players. Each score is designed
          to answer a specific question: How good is this player right now? How high is their ceiling?
          How do they compare to their peers?
        </p>

        {/* Prospect Score */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-accent/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary-accent" />
            </div>
            <SectionHeader className="text-text-heading">Prospect Score</SectionHeader>
          </div>
          <p className="text-text-body mb-4">
            The Prospect Score evaluates a player&apos;s potential to become a top-tier professional.
            It is not a measure of current skill alone — it weighs <strong>upside</strong> and
            <strong> trajectory</strong> just as heavily as present performance.
          </p>
          <p className="text-text-body mb-6">
            Our model looks at several key signals: the highest competitive level reached in SoloQ,
            tournament results in regional leagues, the player&apos;s age as a proxy for development
            runway, the strength of their current league, consistency in professional matches,
            overall seasonal performance, and the qualitative assessment of our scouting team.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: TrendingUp, label: "SoloQ Peak", desc: "Highest competitive level reached individually" },
              { icon: Trophy, label: "Pro Results", desc: "Tournament placements in their current league" },
              { icon: Clock, label: "Age Factor", desc: "Younger players get more credit for potential" },
              { icon: Shield, label: "League Strength", desc: "Context matters: LFL and LES weigh more than amateur" },
              { icon: BarChart3, label: "Match Consistency", desc: "Winrate and stability across pro games" },
              { icon: Users, label: "Seasonal Performance", desc: "Overall statistical output for the current year" },
              { icon: Eye, label: "Scout Evaluation", desc: "Human eye-test rating by our analysts" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                <item.icon className="h-4 w-4 text-primary-accent mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-text-heading">{item.label}</div>
                  <div className="text-xs text-text-muted">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-text-muted text-xs mt-4">
            The exact weighting of each factor is proprietary and adjusted seasonally based on
            historical predictive accuracy.
          </p>
        </section>

        {/* Global Score */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-accent/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-accent" />
            </div>
            <SectionHeader className="text-text-heading">Global Score</SectionHeader>
          </div>
          <p className="text-text-body mb-4">
            The Global Score is a composite index of a player&apos;s statistical production in
            professional matches. It distills dozens of raw metrics into a single 0–100 rating
            that answers one question: <em>How productive is this player compared to everyone else?</em>
          </p>
          <p className="text-text-body mb-4">
            We look at laning performance (early gold and CS advantages), damage output, gold
            efficiency, vision control, kill participation, and objective involvement. Each metric
            is normalized so that a score of 50 represents the league average, and scores above
            75 indicate elite production.
          </p>
          <p className="text-text-muted text-xs">
            Global Score is position-aware: a support with a lower damage score can still rank
            highly if their vision and setup metrics are exceptional.
          </p>
        </section>

        {/* Tier Score */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-accent/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-accent" />
            </div>
            <SectionHeader className="text-text-heading">Tier Score</SectionHeader>
          </div>
          <p className="text-text-body mb-4">
            The Tier Score adjusts a player&apos;s performance for the level of competition they face.
            Two players with identical raw stats are not equally valuable if one plays in the LEC
            and the other in a Tier 4 regional league.
          </p>
          <p className="text-text-body mb-4">
            We apply a league coefficient based on historical data: major leagues (LCK, LPL, LEC)
            carry the highest weight, followed by premier ERLs (LFL, LES, TCL), then division 2
            and amateur circuits. A dominant player in a weaker league will see their Tier Score
            adjusted downward, while a solid performer in a top league gets full credit.
          </p>
          <p className="text-text-muted text-xs">
            Tier Score is particularly useful for comparing players across different competitive
            levels — for example, when deciding whether a star from a lower league can translate
            their performance upward.
          </p>
        </section>
      </div>
    </div>
  );
}
