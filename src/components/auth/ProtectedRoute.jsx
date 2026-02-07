"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

/**
 * ProtectedRoute Component
 * Wraps pages that require authentication
 */
export function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in, redirect to login
                router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
            } else if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                // Wrong role, redirect to appropriate page
                if (user.role === "recruiter") {
                    router.push("/admin/dashboard");
                } else if (user.role === "candidate") {
                    router.push("/candidate/profile");
                } else {
                    router.push("/");
                }
            }
        }
    }, [user, loading, router, pathname, allowedRoles]);

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Not authorized
    if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
        return null;
    }

    return children;
}
