"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Header } from "@/components/layout";
import { Button, Card, Badge, Input } from "@/components/ui";
import { ArrowLeft, Search, Download, ChevronRight, User } from "lucide-react";

export default function CandidateListPage() {
    const router = useRouter();
    const params = useParams();
    const [jd, setJd] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchData();
    }, [params.jdId]);

    const fetchData = async () => {
        try {
            const [jdRes, candidatesRes] = await Promise.all([
                api.getJD(params.jdId),
                api.getCandidates(params.jdId),
            ]);

            if (jdRes.success) {
                setJd(jdRes.data);
            }
            if (candidatesRes.success) {
                setCandidates(candidatesRes.data?.candidates || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.exportCSV(params.jdId);
            if (response.success && response.data?.csv) {
                // Create download
                const blob = new Blob([response.data.csv], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `candidates-${params.jdId}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            onboarding: "info",
            resume_review: "warning",
            resume_rejected: "error",
            ready: "info",
            in_progress: "info",
            submitted: "success",
            evaluating: "info",
            evaluated: "success",
            decided: "success",
        };
        return <Badge variant={variants[status] || "info"}>{status?.replace("_", " ")}</Badge>;
    };

    const filteredCandidates = candidates.filter((c) => {
        const matchesSearch =
            c.candidate?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.candidate?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header showNav={false} />

            <main className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Back Button & Title */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.push("/admin/dashboard")}
                            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4"
                        >
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </button>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-light text-[var(--text-primary)] mb-2">
                                    {jd?.parsedContent?.roleTitle || "Candidates"}
                                </h1>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {candidates.length} total candidates
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => router.push(`/admin/setup/${params.jdId}`)}>
                                    Edit Settings
                                </Button>
                                <Button variant="secondary" onClick={handleExport}>
                                    <Download size={16} />
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Assessment Link Card */}
                    {jd?.assessmentConfig?.assessmentLink && (
                        <Card className="mb-8 border-l-4 border-l-[var(--accent)]">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">
                                        Assessment Link
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                                        Share this link with candidates to start the assessment.
                                    </p>
                                    <div className="flex items-center gap-2 bg-[var(--bg-secondary)] p-2 rounded-md border border-[var(--border-default)]">
                                        <code className="text-sm text-[var(--text-primary)] flex-1 break-all">
                                            {`${window.location.origin}/assess/${jd.assessmentConfig.assessmentLink}`}
                                        </code>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        const link = `${window.location.origin}/assess/${jd.assessmentConfig.assessmentLink}`;
                                        navigator.clipboard.writeText(link);
                                        // Improved toast notification
                                        setToast({ message: "Link copied to clipboard!", type: "success" });
                                        setTimeout(() => setToast(null), 3000);
                                    }}
                                >
                                    Copy Link
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Filters */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search candidates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg focus:border-[var(--accent)] focus:outline-none"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)]"
                        >
                            <option value="all">All Status</option>
                            <option value="onboarding">Onboarding</option>
                            <option value="resume_review">Resume Review</option>
                            <option value="ready">Ready to Start</option>
                            <option value="in_progress">In Progress</option>
                            <option value="submitted">Submitted</option>
                            <option value="evaluated">Evaluated</option>
                            <option value="decided">Decided</option>
                        </select>
                    </div>

                    {/* Candidates List */}
                    {loading ? (
                        <div className="text-center py-12 text-[var(--text-muted)]">Loading...</div>
                    ) : filteredCandidates.length === 0 ? (
                        <Card padding="lg" className="text-center py-12">
                            <User size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
                            <h3 className="text-lg font-light text-[var(--text-primary)] mb-2">
                                No Candidates Found
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {candidates.length === 0
                                    ? "Share your assessment link to start receiving candidates"
                                    : "Try adjusting your filters"}
                            </p>
                        </Card>
                    ) : (
                        <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
                                        <th className="px-6 py-3 text-left text-xs font-normal text-[var(--text-muted)] uppercase tracking-wider">
                                            Candidate
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-normal text-[var(--text-muted)] uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-normal text-[var(--text-muted)] uppercase tracking-wider">
                                            Resume Match
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-normal text-[var(--text-muted)] uppercase tracking-wider">
                                            Score
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-normal text-[var(--text-muted)] uppercase tracking-wider">
                                            Submitted
                                        </th>
                                        <th className="px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCandidates.map((candidate) => (
                                        <tr
                                            key={candidate._id}
                                            className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-normal text-[var(--text-primary)]">
                                                        {candidate.candidate?.name || "Unknown"}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        {candidate.candidate?.email}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(candidate.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-[var(--text-primary)]">
                                                    {candidate.resume?.matchScore ? `${candidate.resume.matchScore}%` : "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-[var(--text-primary)]">
                                                    {candidate.totalScore ? `${candidate.totalScore}%` : "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-[var(--text-secondary)]">
                                                    {formatDate(candidate.submittedAt)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link href={`/admin/candidate/${candidate._id}`}>
                                                    <button className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
                                                        <ChevronRight size={16} className="text-[var(--text-muted)]" />
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Configurable Toast Notification */}
            {
                toast && (
                    <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-sm font-medium transition-all transform translate-y-0 opacity-100 ${toast.type === "success"
                        ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)] border border-[var(--status-success-text)]"
                        : "bg-[var(--status-error-bg)] text-[var(--status-error-text)] border border-[var(--status-error-text)]"
                        }`}>
                        {toast.message}
                    </div>
                )
            }
        </div>
    );
}
