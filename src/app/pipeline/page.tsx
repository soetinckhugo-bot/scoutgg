"use client";

import ScoutingBoard from "@/components/ScoutingBoard";
import { PageTitle } from "@/components/ui/typography";
import { ClipboardList } from "lucide-react";

export default function PipelinePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <PageTitle className="text-text-heading mb-1 flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary-accent" />
          Scouting Pipeline
        </PageTitle>
        <p className="text-text-body">
          Track and manage your scouting workflow from discovery to signing.
        </p>
      </div>
      <ScoutingBoard />
    </div>
  );
}
