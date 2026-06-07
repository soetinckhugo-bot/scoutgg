"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CopyLinkButton from "./CopyLinkButton";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { getBaseUrl } from "@/lib/utils";

interface ClipLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clip: {
    id: string;
    title: string;
    platform: string;
    videoId: string;
  } | null;
}

function getEmbedUrl(platform: string, videoId: string): string {
  if (platform === "tiktok") {
    return `https://www.tiktok.com/embed/${videoId}`;
  }
  return `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&vq=hd1080&modestbranding=1&iv_load_policy=3`;
}

export default function ClipLightbox({ open, onOpenChange, clip }: ClipLightboxProps) {
  if (!clip) return null;

  const pageUrl = `${getBaseUrl()}/clips/${clip.id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-none max-w-md p-0 overflow-hidden gap-0">
        <div className="relative w-full" style={{ paddingBottom: "177.78%" }}>
          <iframe
            src={getEmbedUrl(clip.platform, clip.videoId)}
            title={clip.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="bg-card border-t border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-text-heading text-center">{clip.title}</h3>
          <div className="flex items-center justify-center gap-3">
            <CopyLinkButton url={pageUrl} variant="outline" size="sm" className="h-9 px-3 border-border text-text-body hover:bg-surface-hover" />
            <Button variant="outline" size="sm" className="h-9 px-3 gap-1.5 border-border text-text-body hover:bg-surface-hover" asChild>
              <Link href={`/clips/${clip.id}`} onClick={() => onOpenChange(false)}>
                <ExternalLink className="h-4 w-4" />
                Open page
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
