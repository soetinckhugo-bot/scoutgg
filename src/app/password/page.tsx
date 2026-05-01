"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

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
      }
    } catch {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#141621] border border-[#2A2D3A] rounded-lg p-8">
        <h1 className="text-2xl font-bold text-[#E9ECEF] mb-2 text-center">
          LeagueScout
        </h1>
        <p className="text-[#A0AEC0] text-sm text-center mb-6">
          Ce site est en développement. Entre le mot de passe pour continuer.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full bg-[#1A1D29] border border-[#2A2D3A] rounded-md px-4 py-3 text-[#E9ECEF] placeholder-[#6C757D] focus:outline-none focus:border-[#E94560]"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">
              Mot de passe incorrect.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[#E94560] hover:bg-[#d13a54] text-white font-medium py-3 rounded-md transition-colors"
          >
            Entrer
          </button>
        </form>
      </div>
    </div>
  );
}
