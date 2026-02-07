"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import { User, LogOut } from "lucide-react";

/**
 * Header Component
 * Minimal navigation header with auth-aware navigation
 */
export function Header({ showNav = true }) {
    const router = useRouter();
    const { user, loading, logout } = useAuth();

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const getProfileLink = () => {
        if (user?.role === "recruiter") return "/profile";
        if (user?.role === "candidate") return "/candidate/profile";
        return "/profile";
    };

    const getDashboardLink = () => {
        if (user?.role === "recruiter") return "/admin/dashboard";
        if (user?.role === "candidate") return "/candidate/profile";
        return "/admin/dashboard";
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-default)]">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-lg font-light tracking-tight text-[var(--text-primary)]">
                        AI Hiring
                    </span>
                </Link>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    {showNav && (
                        <nav className="hidden md:flex items-center gap-6">
                            <Link
                                href="/#how-it-works"
                                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                How it Works
                            </Link>
                            <Link
                                href="/#features"
                                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                Features
                            </Link>
                        </nav>
                    )}

                    {/* Auth Navigation */}
                    {!loading && (
                        <div className="flex items-center gap-3">
                            {user ? (
                                <>
                                    <Link
                                        href={getDashboardLink()}
                                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden md:block"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href={getProfileLink()}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                                    >
                                        <User size={16} className="text-[var(--text-secondary)]" />
                                        <span className="text-[var(--text-primary)] hidden sm:inline">
                                            {user.name?.split(" ")[0] || "Profile"}
                                        </span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border-2 border-[var(--border-default)] rounded-lg px-4 py-2"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/auth/signup"
                                        className="px-4 py-2 text-sm cursor-pointer text-[var(--accent-text)] rounded-lg hover:opacity-90 transition-opacity border-2 border-[var(--border-default)]"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    )}

                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}

