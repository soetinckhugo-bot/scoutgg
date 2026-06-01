"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ClipLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clip: {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-none max-w-md p-0 overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: "177.78%" }}>
          <iframe
            src={getEmbedUrl(clip.platform, clip.videoId)}
            title={clip.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
