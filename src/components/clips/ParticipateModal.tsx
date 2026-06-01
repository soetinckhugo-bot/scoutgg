"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Film, Mail, Clock, FileVideo, Music, Shield } from "lucide-react";

export default function ParticipateModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-primary-accent hover:bg-primary-accent/90 text-text-heading">
        <Film className="h-4 w-4 mr-2" />
        Participate
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text-heading text-lg">How to participate?</DialogTitle>
            <DialogDescription className="text-text-body text-sm">
              Send your clip via email to appear on the site.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-text-body">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-heading">Send by email</p>
                <p>Send your clip to the dedicated address (coming soon) with your in-game name, role, clip title, and YouTube Short or TikTok link.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-heading">Max duration 60s</p>
                <p>Your clip must not exceed 60 seconds. Vertical format (9:16) recommended.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileVideo className="h-5 w-5 text-primary-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-heading">YouTube Short or TikTok</p>
                <p>Your clip must be published on YouTube Shorts or TikTok. No direct upload.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Music className="h-5 w-5 text-primary-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-heading">No copyrighted music</p>
                <p>Avoid copyrighted music to prevent Content ID claims.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-heading">Terms acceptance</p>
                <p>By participating, you authorize the publication of your clip on the site&apos;s channel.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
