"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Film, Mail, Clock, FileVideo, Music, Shield } from "lucide-react";

export default function ParticipateModal() {
  return (
    <Dialog>
      <DialogTrigger>
        <Button className="bg-primary-accent hover:bg-primary-accent/90 text-text-heading">
          <Film className="h-4 w-4 mr-2" />
          Participer
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-text-heading text-lg">Comment participer ?</DialogTitle>
          <DialogDescription className="text-text-body text-sm">
            Envoie ton clip par mail pour apparaître sur le site.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm text-text-body">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-heading">Envoi par mail</p>
              <p>Envoie ton clip à l'adresse dédiée (à venir) avec ton pseudo, ton rôle, le titre du clip et le lien YouTube unlisted.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-heading">Durée max 60s</p>
              <p>Ton clip ne doit pas dépasser 60 secondes.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileVideo className="h-5 w-5 text-primary-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-heading">Format YouTube</p>
              <p>Ton clip doit être en non-listé sur YouTube. Pas d'upload MP4 direct.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Music className="h-5 w-5 text-primary-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-heading">Pas de musique copyright</p>
              <p>Évite les musiques protégées pour ne pas te prendre un Content ID.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-heading">Acceptation des CGU</p>
              <p>En participant, tu autorises la publication de ton clip sur la chaîne YouTube du site.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
