"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, Button, Input } from "@/components/ui";
import { ThemeToggle } from "@/components/layout";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const redirect = searchParams.get("redirect") || "/admin/dashboard";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Please enter your email and password");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const user = await login(email, password);

            // Redirect based on role
            if (user.role === "recruiter") {
                router.push(redirect.startsWith("/admin") ? redirect : "/admin/dashboard");
            } else if (user.role === "candidate") {
                router.push("/candidate/dashboard");
            } else {
                router.push("/");
            }
        } catch (err) {
            setError(err.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
            {/* Theme Toggle */}
            <div className="fixed top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="text-2xl font-light text-[var(--text-primary)]">
                        AI Hiring
                    </Link>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Sign in to your account
                    </p>
                </div>

                <Card padding="lg">
                    {error && (
                        <div className="mb-4 p-3 bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg focus:border-[var(--accent)] focus:outline-none placeholder:text-[var(--text-muted)]"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-12 py-3 text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg focus:border-[var(--accent)] focus:outline-none placeholder:text-[var(--text-muted)]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <Button type="submit" className="w-full" loading={loading}>
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-[var(--border-default)] text-center">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Don't have an account?{" "}
                            <Link href="/auth/signup" className="text-[var(--text-primary)] hover:underline">
                                Sign up for an account
                            </Link>
                        </p>
                    </div>
                </Card>

                <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
                    Candidates can also sign in here to view their dashboard.
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-[var(--text-muted)]">Loading...</div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
