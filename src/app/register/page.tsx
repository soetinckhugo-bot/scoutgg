"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      toast.success("Account created! Signing you in...");

      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        toast.error("Account created but sign-in failed. Please log in manually.");
        router.push("/login");
        return;
      }

      // Force full page navigation to ensure session is picked up
      window.location.href = "/dashboard";
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E94560] flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-[#E9ECEF]">
              League<span className="text-[#E94560]">Scout</span>
            </span>
          </Link>
        </div>

        <Card className="border-[#2A2D3A] bg-[#1A1D29]">
          <CardHeader>
            <CardTitle className="text-xl text-center text-[#E9ECEF]">
              Create your account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#ADB5BD]">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="bg-[#141621] border-[#2A2D3A] text-[#E9ECEF] placeholder:text-[#6C757D] focus:border-[#E94560] focus:ring-[#E94560]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#ADB5BD]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-[#141621] border-[#2A2D3A] text-[#E9ECEF] placeholder:text-[#6C757D] focus:border-[#E94560] focus:ring-[#E94560]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#ADB5BD]">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="bg-[#141621] border-[#2A2D3A] text-[#E9ECEF] placeholder:text-[#6C757D] focus:border-[#E94560] focus:ring-[#E94560]"
                />
                <p className="text-xs text-[#6C757D]">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#ADB5BD]">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-[#141621] border-[#2A2D3A] text-[#E9ECEF] placeholder:text-[#6C757D] focus:border-[#E94560] focus:ring-[#E94560]"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#E94560] text-white hover:bg-[#d13b54]"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#6C757D]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[#E94560] hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
