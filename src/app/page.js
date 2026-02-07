"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { JDUpload } from "@/components/features/JDUpload";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import { ArrowRight, Shield, Zap, BarChart3, Lock } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJDSubmit = async ({ file, text }) => {
    if (!user) return; // Extra safeguard

    setLoading(true);
    setError("");

    try {
      // Upload JD
      const response = await api.uploadJD(text, file);

      if (response.success && response.data?.id) {
        // Redirect to processing page
        router.push(`/admin/processing/${response.data.id}`);
      } else {
        setError("Failed to upload job description. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[var(--text-primary)] mb-6">
            AI-Powered Hiring,
            <br />
            <span className="text-[var(--text-secondary)]">Simplified</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed">
            Transform your job descriptions into intelligent assessments.
            Evaluate candidates based on what truly matters — the role requirements.
          </p>

          {/* JD Upload Section */}
          <div className="relative bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl p-8 md:p-12 shadow-[var(--shadow-sm)]">
            <h2 className="text-xl font-light text-[var(--text-primary)] mb-2">
              Start with your Job Description
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-8">
              Upload or paste your JD — our AI will handle the rest
            </p>

            {/* Show JDUpload only when logged in */}
            {!authLoading && isLoggedIn ? (
              <>
                <JDUpload onSubmit={handleJDSubmit} loading={loading} />
                {error && (
                  <p className="mt-4 text-sm text-[var(--status-error-text)]">
                    {error}
                  </p>
                )}
              </>
            ) : (
              /* Login Required Overlay */
              <div className="py-12 px-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                  <Lock size={28} className="text-[var(--text-muted)]" />
                </div>
                <h3 className="text-lg font-light text-[var(--text-primary)] mb-2">
                  Sign in to get started
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md mx-auto">
                  Create a free account to upload job descriptions and start evaluating candidates.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Link
                    href="/auth/login"
                    className="px-6 py-3 text-sm text-[var(--accent-text)] rounded-lg hover:opacity-90 transition-opacity border-2 border-[var(--border-default)]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-6 py-3 text-sm border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-center text-[var(--text-primary)] mb-4">
            How it Works
          </h2>
          <p className="text-center text-[var(--text-secondary)] mb-16 max-w-2xl mx-auto">
            From job description to qualified candidates in four simple steps
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Upload JD",
                description: "Provide your job description — we extract skills, requirements, and evaluation criteria automatically.",
              },
              {
                step: "02",
                title: "Configure",
                description: "Review AI-generated rubrics, adjust weights, and set your assessment parameters.",
              },
              {
                step: "03",
                title: "Assess",
                description: "Share the unique link. Candidates complete proctored assessments tailored to the role.",
              },
              {
                step: "04",
                title: "Evaluate",
                description: "Review AI-scored results, competency analysis, and make informed hiring decisions.",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-light text-[var(--text-muted)] mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-normal text-[var(--text-primary)] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.description}
                </p>
                {index < 3 && (
                  <div className="hidden md:block mt-6">
                    <ArrowRight size={20} className="mx-auto text-[var(--text-muted)]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-center text-[var(--text-primary)] mb-4">
            Enterprise-Grade Assessment
          </h2>
          <p className="text-center text-[var(--text-secondary)] mb-16 max-w-2xl mx-auto">
            Built for organizations that take hiring seriously
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Proctored Environment",
                description: "AI-powered proctoring monitors for tab switches, multiple faces, and device detection — all reviewed by your team.",
              },
              {
                icon: Zap,
                title: "JD-Driven Assessments",
                description: "Evaluations are generated from your job requirements. No generic tests — every question maps to role-specific skills.",
              },
              {
                icon: BarChart3,
                title: "Intelligent Analysis",
                description: "Skill-wise competency scores, resume-to-performance correlation, and clear actionable insights for every candidate.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl"
              >
                <div className="w-10 h-10 mb-4 flex items-center justify-center rounded-lg bg-[var(--bg-secondary)]">
                  <feature.icon size={20} className="text-[var(--text-secondary)]" />
                </div>
                <h3 className="text-lg font-normal text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light text-[var(--text-primary)] mb-6">
            Built on Trust
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed">
            AI assists, but you decide. Every evaluation is transparent, every flag is reviewable,
            and every hiring decision remains in your hands.
          </p>
          <div className="grid grid-cols-3 gap-8">
            {[
              { value: "100%", label: "Transparent Scoring" },
              { value: "Zero", label: "Auto-Disqualifications" },
              { value: "Full", label: "Audit Trail" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-2xl font-light text-[var(--text-primary)]">
                  {stat.value}
                </div>
                <div className="text-sm text-[var(--text-muted)]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
