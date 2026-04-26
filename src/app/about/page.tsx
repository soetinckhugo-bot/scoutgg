import { MessageCircle, TrendingUp, Users, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about LeagueScout, the professional scouting platform for League of Legends esports. Our mission, methodology, and team.",
  openGraph: {
    title: "About | LeagueScout",
    description: "The professional scouting platform for League of Legends esports.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1 className="text-3xl font-bold text-[#1A1A2E] dark:text-white">
            League<span className="text-[#E94560]">Scout</span>
          </h1>
        </div>
        <p className="text-lg text-[#6C757D] dark:text-gray-400">
          The professional scouting platform for League of Legends
        </p>
      </div>

      {/* Mission */}
      <Card className="mb-8 border-[#E9ECEF] dark:border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-[#1A1A2E] dark:text-white mb-4">Our Mission</h2>
          <p className="text-[#6C757D] dark:text-gray-400 leading-relaxed">
            LeagueScout was built to bridge the gap between raw talent and opportunity 
            in the League of Legends ecosystem. We believe that every player deserves 
            to be seen, analyzed, and given a chance to prove themselves — whether 
            they are grinding in solo queue or competing in regional leagues.
          </p>
          <p className="text-[#6C757D] dark:text-gray-400 leading-relaxed mt-4">
            Our platform combines data-driven insights with expert scouting analysis 
            to provide the most comprehensive player profiles in the industry. We focus 
            on the European scene (LEC, LFL, ERLs) with select coverage of emerging 
            regions.
          </p>
        </CardContent>
      </Card>

      {/* What We Do */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="border-[#E9ECEF] dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-[#0F3460] dark:text-blue-400 mx-auto mb-3" />
            <h3 className="font-semibold text-[#1A1A2E] dark:text-white mb-2">Player Profiles</h3>
            <p className="text-sm text-[#6C757D] dark:text-gray-400">
              Comprehensive profiles combining soloQ stats, pro performance, and scouting analysis
            </p>
          </CardContent>
        </Card>
        <Card className="border-[#E9ECEF] dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-[#0F3460] dark:text-blue-400 mx-auto mb-3" />
            <h3 className="font-semibold text-[#1A1A2E] dark:text-white mb-2">Scouting Reports</h3>
            <p className="text-sm text-[#6C757D] dark:text-gray-400">
              In-depth written analysis by experienced scouts with industry expertise
            </p>
          </CardContent>
        </Card>
        <Card className="border-[#E9ECEF] dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-[#0F3460] dark:text-blue-400 mx-auto mb-3" />
            <h3 className="font-semibold text-[#1A1A2E] dark:text-white mb-2">Data Insights</h3>
            <p className="text-sm text-[#6C757D] dark:text-gray-400">
              Advanced statistics and trends to identify rising talent before anyone else
            </p>
          </CardContent>
        </Card>
      </div>

      {/* About the Scout */}
      <Card className="mb-8 border-[#E9ECEF] dark:border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-[#1A1A2E] dark:text-white mb-4">The Scout Behind LeagueScout</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-24 h-24 rounded-full bg-[#1A1A2E] dark:bg-[#E94560] flex items-center justify-center text-3xl font-bold text-white shrink-0 mx-auto md:mx-0">
              S
            </div>
            <div>
              <p className="text-[#6C757D] dark:text-gray-400 leading-relaxed">
                With years of experience in the European League of Legends scene, 
                our lead scout has built a reputation for identifying talent before 
                they hit the mainstream. From discovering hidden gems in regional 
                leagues to tracking the development of future LEC stars, the focus 
                has always been on providing actionable, data-backed insights.
              </p>
              <p className="text-[#6C757D] dark:text-gray-400 leading-relaxed mt-4">
                LeagueScout represents the next evolution of that work — a platform 
                where scouting expertise meets modern technology to serve the 
                entire esports ecosystem: teams looking for their next signing, 
                players seeking visibility, and fans wanting to understand the 
                game at a deeper level.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F3460] hover:text-[#1A1A2E] dark:text-blue-400 dark:hover:text-white flex items-center gap-1 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">@LeagueScout</span>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage */}
      <Card className="border-[#E9ECEF] dark:border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-[#1A1A2E] dark:text-white mb-4">League Coverage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { league: "LEC", description: "Europe's top division" },
              { league: "LFL", description: "French league" },
              { league: "LFL Div 2", description: "French 2nd division" },
              { league: "ERLs", description: "European Regional Leagues" },
              { league: "LVP", description: "Spanish league" },
              { league: "Prime League", description: "German league" },
              { league: "NLC", description: "Nordic league" },
              { league: "LTA", description: "Americas (select)" },
            ].map((item) => (
              <div key={item.league} className="p-3 bg-[#F8F9FA] dark:bg-[#1e293b] rounded-lg text-center">
                <p className="font-semibold text-[#1A1A2E] dark:text-white">{item.league}</p>
                <p className="text-xs text-[#6C757D] dark:text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

