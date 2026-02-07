"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, Button } from "@/components/ui";
import { ThemeToggle } from "@/components/layout";
import {
    LayoutDashboard,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronRight,
    Play,
    FileText
} from "lucide-react";

export default function CandidateDashboard() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        fetchData();
        fetchProfile();
    }, []);

    const fetchData = async () => {
        try {
            const response = await api.getCandidateAssessmentHistory();
            if (response.success) {
                setHistory(response.data);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
            setError("Failed to load assessment history");
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await api.getCandidateProfile();
            if (response.success) {
                setProfile(response.data);
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            onboarding: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
            resume_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
            resume_rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
            ready: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
            submitted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
            evaluated: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
        };

        const labels = {
            onboarding: "Onboarding",
            resume_review: "Resume Review",
            resume_rejected: "Resume Rejected",
            ready: "Ready to Start",
            in_progress: "In Progress",
            submitted: "Submitted",
            evaluated: "Completed",
        };

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--bg-elevated)] border-b border-[var(--border-default)] z-50 px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-xl font-light text-[var(--text-primary)]">
                        AI Hiring
                    </Link>
                    <span className="text-[var(--text-muted)]">/</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">Candidate Dashboard</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{profile?.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{profile?.email}</p>
                    </div>
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            api.logout();
                            window.location.href = "/auth/login";
                        }}
                    >
                        Sign Out
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-light text-[var(--text-primary)]">
                        My Assessments
                    </h1>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-[var(--text-muted)]">Loading assessments...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-lg text-center">
                        {error}
                    </div>
                ) : history.length === 0 ? (
                    <Card padding="lg" className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-4">
                            <LayoutDashboard className="text-[var(--text-muted)]" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                            No Assessments Yet
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                            You haven't applied to any positions yet. When you receive an assessment link from a recruiter, it will appear here.
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {history.map((assessment) => (
                            <Card key={assessment._id} className="group hover:border-[var(--accent)] transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-medium text-[var(--text-primary)]">
                                                {assessment.roleTitle || assessment.jd?.parsedContent?.roleTitle || "Untitled Role"}
                                            </h3>
                                            {getStatusBadge(assessment.status)}
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                                            <BuildingIcon size={14} />
                                            {assessment.companyName || assessment.jd?.company?.name || "Company"}
                                            <span className="text-[var(--text-muted)]">•</span>
                                            <Clock size={14} />
                                            {assessment.submittedAt
                                                ? `Submitted ${new Date(assessment.submittedAt).toLocaleDateString()}`
                                                : `Started ${new Date(assessment.createdAt || Date.now()).toLocaleDateString()}`
                                            }
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Action Buttons based on status */}
                                        {assessment.status === "onboarding" || assessment.status === "in_progress" || assessment.status === "ready" ? (
                                            assessment.assessmentLink ? ( // Assuming assessmentLink is available or we reconstruct it
                                                <Link href={`/assessment/${assessment.assessmentLink || assessment.jd?.assessmentConfig?.assessmentLink}`}>
                                                    <Button size="sm" className="gap-2">
                                                        <Play size={16} />
                                                        Continue
                                                    </Button>
                                                </Link>
                                            ) : null
                                        ) : null}

                                        {assessment.status === "evaluated" && assessment.resultReleased && (
                                            <Link href={`/candidate/profile` /* Or specific result page */}>
                                                <Button variant="outline" size="sm" className="gap-2">
                                                    <FileText size={16} />
                                                    View Report
                                                </Button>
                                            </Link>
                                        )}

                                        {!assessment.resultReleased && assessment.status === 'evaluated' && (
                                            <span className="text-sm text-[var(--text-muted)] italic">Result pending release</span>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function BuildingIcon({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M8 10h.01" />
            <path d="M16 10h.01" />
            <path d="M8 14h.01" />
            <path d="M16 14h.01" />
        </svg>
    );
}
