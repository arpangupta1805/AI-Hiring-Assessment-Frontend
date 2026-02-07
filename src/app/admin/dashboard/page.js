"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Header, Footer } from "@/components/layout";
import { Button, Card, Badge } from "@/components/ui";
import { Plus, Users, Clock, BarChart3, ChevronRight, Download, ChevronLeft, Trash2 } from "lucide-react";

function DashboardContent() {
    const router = useRouter();
    const [jds, setJds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchJDs();
    }, [page]);

    const fetchJDs = async () => {
        setLoading(true);
        try {
            const response = await api.getJDs(page, limit);
            if (response.success) {
                setJds(response.data || []);
                setTotalPages(response.pagination?.pages || 1);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const blob = await api.getJDs(1, 1000, 'csv'); // Export all/many
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `assessments-history-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError("Failed to export: " + err.message);
        } finally {
            setExporting(false);
        }
    };

    const handleDelete = async (e, jdId) => {
        e.preventDefault(); // Prevent navigation
        if (!window.confirm("Are you sure you want to delete this assessment? This action cannot be undone and will delete all candidate data associated with it.")) {
            return;
        }

        try {
            await api.deleteJD(jdId);
            // Refresh list
            fetchJDs();
        } catch (err) {
            setError("Failed to delete: " + err.message);
        }
    };

    const getStatusBadge = (jd) => {
        if (!jd.assessmentConfig?.assessmentLink) {
            return <Badge variant="warning">Draft</Badge>;
        }
        if (jd.assessmentConfig?.endTime && new Date(jd.assessmentConfig.endTime) < new Date()) {
            return <Badge variant="info">Closed</Badge>;
        }
        return <Badge variant="success">Active</Badge>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
            <Header showNav={false} />

            <main className="flex-1 pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-light text-[var(--text-primary)] mb-2">
                                Dashboard
                            </h1>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Manage your assessments and review candidates
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={handleExport} loading={exporting} disabled={jds.length === 0}>
                                <Download size={18} />
                                Export CSV
                            </Button>
                            <Button onClick={() => router.push("/")}>
                                <Plus size={18} />
                                New Assessment
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12 text-[var(--text-muted)]">
                            Loading assessments...
                        </div>
                    ) : jds.length === 0 ? (
                        <Card padding="lg" className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-[var(--bg-secondary)]">
                                <BarChart3 size={28} className="text-[var(--text-muted)]" />
                            </div>
                            <h3 className="text-lg font-light text-[var(--text-primary)] mb-2">
                                No Assessments Yet
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-6">
                                Create your first assessment by uploading a job description
                            </p>
                            <Button onClick={() => router.push("/")}>
                                Create Assessment
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {jds.map((jd) => (
                                <Card key={jd._id} padding="none" hover>
                                    <Link href={`/admin/dashboard/${jd._id}`}>
                                        <div className="p-6 flex items-center gap-6">
                                            {/* Role Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-normal text-[var(--text-primary)]">
                                                        {jd.parsedContent?.roleTitle || "Untitled Role"}
                                                    </h3>
                                                    {getStatusBadge(jd)}
                                                </div>
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    {jd.parsedContent?.aboutCompany?.substring(0, 100) || "No description"}
                                                    {jd.parsedContent?.aboutCompany?.length > 100 ? "..." : ""}
                                                </p>
                                            </div>

                                            {/* Stats */}
                                            <div className="hidden md:flex items-center gap-8">
                                                <div className="text-center">
                                                    <div className="flex items-center gap-1 text-[var(--text-muted)] mb-1">
                                                        <Users size={14} />
                                                        <span className="text-xs">Candidates</span>
                                                    </div>
                                                    <p className="text-lg font-normal text-[var(--text-primary)]">
                                                        {jd.stats?.totalCandidates || 0}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="flex items-center gap-1 text-[var(--text-muted)] mb-1">
                                                        <Clock size={14} />
                                                        <span className="text-xs">Created</span>
                                                    </div>
                                                    <p className="text-sm text-[var(--text-primary)]">
                                                        {formatDate(jd.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => handleDelete(e, jd._id)}
                                                    className="p-2 text-[var(--text-muted)] hover:text-[var(--status-error-text)] hover:bg-[var(--status-error-bg)] rounded-full transition-colors"
                                                    title="Delete Assessment"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <ChevronRight size={20} className="text-[var(--text-muted)]" />
                                            </div>
                                        </div>
                                    </Link>
                                </Card>
                            ))}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-8">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="!px-3"
                                    >
                                        <ChevronLeft size={18} />
                                    </Button>
                                    <span className="text-sm text-[var(--text-secondary)]">
                                        Page {page} of {totalPages}
                                    </span>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="!px-3"
                                    >
                                        <ChevronRight size={18} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute allowedRoles={["recruiter"]}>
            <DashboardContent />
        </ProtectedRoute>
    );
}

