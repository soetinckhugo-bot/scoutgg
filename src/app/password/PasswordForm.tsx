"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import DarkCard from "@/components/ui/DarkCard";

interface PasswordFormProps {
  redirect: string;
}

export default function PasswordForm({ redirect }: PasswordFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    try {
      const res = await fetch("/api/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(true);
        setLoading(false);
      }
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <DarkCard padding="lg" className="space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-text-heading tracking-tight">
              LeagueScout
            </h1>
            <p className="text-sm text-text-body">
              Site en développement. Entre le mot de passe pour accéder.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-text-body">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">
                Mot de passe incorrect.
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !password}
            >
              {loading ? (
                "Vérification..."
              ) : (
                <>
                  Entrer
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </DarkCard>
      </div>
    </div>
  );
}
