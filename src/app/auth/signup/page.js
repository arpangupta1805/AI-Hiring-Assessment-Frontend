"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, Button, Input } from "@/components/ui";
import { ThemeToggle } from "@/components/layout";
import { User, Mail, Lock, Building, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        companyName: "",
        role: "recruiter", // Default to recruiter
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.password) {
            setError("Please fill in all required fields");
            return;
        }

        if (formData.role === "recruiter" && !formData.companyName) {
            setError("Company Name is required for recruiters");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError("");

        try {
            let response;
            if (formData.role === "recruiter") {
                response = await api.signupRecruiter({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    companyName: formData.companyName,
                });
            } else {
                // Determine API endpoint for candidate signup
                // Since api.signupRecruiter is specific, we might need a generic signup or api.request
                // Let's use api.request for now to hit the generic signup endpoint
                response = await api.request("/api/auth/signup", {
                    method: "POST",
                    body: {
                        name: formData.name,
                        email: formData.email,
                        password: formData.password,
                        role: "candidate",
                        username: formData.email.split("@")[0] + Math.floor(Math.random() * 1000), // Temp username
                    },
                    auth: false,
                });
            }

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/auth/login");
                }, 2000);
            }
        } catch (err) {
            setError(err.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
                <Card padding="lg" className="max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--status-success-bg)] flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-[var(--status-success-text)]" />
                    </div>
                    <h2 className="text-xl font-light text-[var(--text-primary)] mb-2">
                        Account Created
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Redirecting you to login...
                    </p>
                </Card>
            </div>
        );
    }

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
                        Create your account
                    </p>
                </div>

                <Card padding="lg">
                    {error && (
                        <div className="mb-4 p-3 bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Role Selection */}
                        <div className="flex gap-2 p-1 bg-[var(--bg-secondary)] rounded-lg mb-4">
                            <button
                                type="button"
                                onClick={() => handleChange("role", "recruiter")}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.role === "recruiter"
                                        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    }`}
                            >
                                Recruiter
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange("role", "candidate")}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.role === "candidate"
                                        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    }`}
                            >
                                Candidate
                            </button>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg focus:border-[var(--accent)] focus:outline-none placeholder:text-[var(--text-muted)]"
                                />
                            </div>
                        </div>

                        {/* Company (Recruiter Only) */}
                        {formData.role === "recruiter" && (
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                    Company Name
                                </label>
                                <div className="relative">
                                    <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => handleChange("companyName", e.target.value)}
                                        placeholder="Acme Inc."
                                        className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg focus:border-[var(--accent)] focus:outline-none placeholder:text-[var(--text-muted)]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                Work Email
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    placeholder="john@company.com"
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
                                    value={formData.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    placeholder="Min. 6 characters"
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                    placeholder="Confirm your password"
                                    className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg focus:border-[var(--accent)] focus:outline-none placeholder:text-[var(--text-muted)]"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <Button type="submit" className="w-full" loading={loading}>
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-[var(--border-default)] text-center">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="text-[var(--text-primary)] hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
