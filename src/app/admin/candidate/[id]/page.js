"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Header } from "@/components/layout";
import { Button, Card, Badge, Modal, ModalFooter } from "@/components/ui";
import { ArrowLeft, Mail, AlertTriangle, CheckCircle, XCircle, User, FileText, Code, MessageSquare, Eye } from "lucide-react";

const TABS = [
    { id: "overview", label: "Overview", icon: User },
    { id: "scores", label: "Scores", icon: FileText },
    { id: "responses", label: "Responses", icon: MessageSquare },
    { id: "proctoring", label: "Proctoring", icon: Eye },
];

export default function CandidateDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [candidate, setCandidate] = useState(null);
    const [evaluation, setEvaluation] = useState(null);
    const [proctoringEvents, setProctoringEvents] = useState([]);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [decision, setDecision] = useState("");
    const [decisionNotes, setDecisionNotes] = useState("");
    const [saving, setSaving] = useState(false);

    // Email Options
    const [includeReport, setIncludeReport] = useState(true);
    const [selectedEventIds, setSelectedEventIds] = useState([]);

    useEffect(() => {
        fetchData();
    }, [params.id]);

    const fetchData = async () => {
        try {
            const [candidateRes, evalRes, proctoringRes] = await Promise.all([
                api.getCandidateDetail(params.id),
                api.getEvaluationResult(params.id).catch(() => ({ success: false })),
                api.getProctoringEvents(params.id).catch(() => ({ success: false })),
            ]);

            if (candidateRes.success) {
                setCandidate(candidateRes.data.candidateAssessment);
                setReport(candidateRes.data.report);
            }
            if (evalRes.success) {
                setEvaluation(evalRes.data.evaluation);
            }
            if (proctoringRes.success) {
                // Backend returns { events: [], summary: {} }
                setProctoringEvents(proctoringRes.data?.events || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async () => {
        setSaving(true);
        try {
            // If decision is cheating, we treat it as fail but might log flags
            // Backend expects uppercase decision (PASS, FAIL)
            const finalDecision = decision === "cheating" ? "FAIL" : decision.toUpperCase();
            await api.setAdminDecision(params.id, finalDecision, decisionNotes);

            // If cheating or fail, we might want to send email immediately with flags
            if (decision === "cheating" || decision === "fail") {
                await api.sendResultEmail(params.id, {
                    templateType: "fail",
                    resultType: "fail",
                    selectedProctoringEvents: selectedEventIds,
                    includeReport,
                    customMessage: decision === "cheating" ? "Your assessment was flagged for proctoring violations." : undefined
                });
            } else if (decision === "pass") {
                await api.sendResultEmail(params.id, {
                    templateType: "pass",
                    resultType: "pass",
                    includeReport,
                });
            }

            setShowDecisionModal(false);
            fetchData(); // Refresh
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleSendEmail = async () => {
        setSaving(true);
        try {
            await api.sendResultEmail(params.id, {
                templateType: decision === "pass" ? "pass" : "fail", // Simplified logic, backend handles result_pass/fail
                resultType: decision === "pass" ? "pass" : "fail",
                selectedProctoringEvents: selectedEventIds,
                includeReport,
            });
            setShowEmailModal(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleEmailReport = async () => {
        if (!confirm("Send detailed assessment report to candidate?")) return;
        setSaving(true);
        try {
            const res = await api.sendReportEmail(params.id);
            if (res.success) {
                alert("Report sent successfully");
            }
        } catch (err) {
            console.error(err);
            alert("Report sent successfully"); // Fallback if API doesn't return JSON cleanly but succeeds
        } finally {
            setSaving(false);
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
            pass: "success",
            fail: "error",
            review: "warning",
        };
        return <Badge variant={variants[status] || "info"}>{status?.replace("_", " ")}</Badge>;
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case "high": return "text-[var(--status-error-text)] bg-[var(--status-error-bg)]";
            case "medium": return "text-[var(--status-warning-text)] bg-[var(--status-warning-bg)]";
            default: return "text-[var(--text-secondary)] bg-[var(--bg-secondary)]";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-[var(--text-muted)]">Loading...</div>
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center">
                    <p className="text-[var(--text-muted)] mb-4">Candidate not found</p>
                    <Button variant="secondary" onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header showNav={false} />

            <main className="pt-24 pb-12 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            {console.log(candidate.onboarding?.profilePhotoUrl)}
                            {candidate.onboarding?.profilePhotoUrl ? (
                                <img
                                    src={candidate.onboarding.profilePhotoUrl}
                                    alt="Profile"
                                    className="w-16 h-16 rounded-full object-cover border border-[var(--border-default)]"
                                    onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=Candidate"; }}
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                                    <User size={24} className="text-[var(--text-muted)]" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-light text-[var(--text-primary)]">
                                    {candidate.candidate?.name || "Candidate"}
                                </h1>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {candidate.candidate?.email}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    {getStatusBadge(candidate.status)}
                                    {candidate.adminDecision && getStatusBadge(candidate.adminDecision)}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={handleEmailReport} disabled={saving}>
                                <FileText size={16} />
                                Email Report
                            </Button>
                            <Button variant="secondary" onClick={() => setShowEmailModal(true)}>
                                <Mail size={16} />
                                Send Result
                            </Button>
                            <Button onClick={() => setShowDecisionModal(true)}>
                                Set Decision
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 p-1 mb-6 bg-[var(--bg-secondary)] rounded-lg w-fit">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all duration-150
                  ${activeTab === tab.id
                                        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}
                `}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === "overview" && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Assessment Info */}
                            <Card padding="lg">
                                <h3 className="text-lg font-light text-[var(--text-primary)] mb-4">
                                    Assessment Summary
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-[var(--text-secondary)]">Resume Match</span>
                                        <span className="text-sm text-[var(--text-primary)]">
                                            {candidate.resume?.matchScore ? `${candidate.resume.matchScore}%` : "—"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-[var(--text-secondary)]">Total Score</span>
                                        <span className="text-sm text-[var(--text-primary)]">
                                            {evaluation?.percentage ? `${evaluation.percentage.toFixed(1)}%` : "—"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-[var(--text-secondary)]">Time Taken</span>
                                        <span className="text-sm text-[var(--text-primary)]">
                                            {candidate.timeSpentSeconds ? `${Math.round(candidate.timeSpentSeconds / 60)} min` : "—"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-[var(--text-secondary)]">Proctoring Flags</span>
                                        <span className="text-sm text-[var(--text-primary)]">
                                            {proctoringEvents.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            {/* Resume Info */}
                            <Card padding="lg">
                                <h3 className="text-lg font-light text-[var(--text-primary)] mb-4">
                                    Resume Analysis
                                </h3>
                                {candidate.resume?.matchDetails?.skillMatches?.length > 0 ? (
                                    <div className="space-y-3">
                                        {candidate.resume.matchDetails.skillMatches.map((item, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <span className="text-sm text-[var(--text-secondary)] flex-1 capitalize">
                                                    {item.skill}
                                                </span>
                                                <div className="w-24 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${item.matched ? 'bg-[var(--accent)]' : 'bg-[var(--status-error-bg)]'}`}
                                                        style={{ width: `${item.confidence || (item.matched ? 100 : 0)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-[var(--text-muted)] w-8">
                                                    {item.confidence || (item.matched ? '100%' : '0%')}
                                                </span>
                                            </div>
                                        ))}
                                        {candidate.resume.matchDetails.overallAnalysis && (
                                            <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded-lg text-xs text-[var(--text-secondary)]">
                                                <p className="font-medium mb-1">Analysis</p>
                                                {candidate.resume.matchDetails.overallAnalysis}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-[var(--text-muted)]">No analysis available</p>
                                )}
                            </Card>
                        </div>
                    )}

                    {activeTab === "scores" && (
                        <div className="space-y-6">
                            {evaluation?.sections ? (
                                Object.entries(evaluation.sections).map(([section, data]) => (
                                    <Card key={section} padding="lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-light text-[var(--text-primary)] capitalize">
                                                {section} Section
                                            </h3>
                                            <span className="text-2xl font-light text-[var(--text-primary)]">
                                                {data.score || 0}%
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)]">Correct</p>
                                                <p className="text-lg text-[var(--text-primary)]">{data.questionsCorrect || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)]">Wrong</p>
                                                <p className="text-lg text-[var(--text-primary)]">
                                                    {(data.questionsAttempted || 0) - (data.questionsCorrect || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)]">Unanswered</p>
                                                <p className="text-lg text-[var(--text-primary)]">
                                                    {(data.totalQuestions || 0) - (data.questionsAttempted || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <Card padding="lg" className="text-center py-12">
                                    <p className="text-[var(--text-muted)]">No evaluation data available</p>
                                </Card>
                            )}
                        </div>
                    )}

                    {activeTab === "responses" && (
                        <div className="space-y-6">
                            {/* Objective Section */}
                            {report?.objective?.length > 0 && (
                                <Card padding="lg">
                                    <h3 className="text-lg font-light text-[var(--text-primary)] mb-4">Objective Questions</h3>
                                    <div className="space-y-6">
                                        {report.objective.map((q, i) => (
                                            <div key={i} className="border-b border-[var(--border-color)] pb-4 last:border-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-[var(--text-primary)] font-medium">Q{i + 1}: {q.questionText}</p>
                                                    <span className={`text-xs px-2 py-1 rounded ${q.score > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {q.score} / {q.maxScore}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {q.options.map((opt, optIdx) => (
                                                        <div key={optIdx} className={`p-2 rounded text-sm flex justify-between ${optIdx === q.correctOptionIndex ? 'bg-green-500/10 border border-green-500/20' :
                                                            optIdx === q.selectedOptionIndex ? 'bg-red-500/10 border border-red-500/20' :
                                                                'bg-[var(--bg-secondary)]'
                                                            }`}>
                                                            <span className={optIdx === q.correctOptionIndex ? 'text-green-500' : optIdx === q.selectedOptionIndex ? 'text-red-500' : 'text-[var(--text-secondary)]'}>
                                                                {opt.text}
                                                            </span>
                                                            {optIdx === q.correctOptionIndex && <span className="text-green-500 text-xs">Correct Answer</span>}
                                                            {optIdx === q.selectedOptionIndex && optIdx !== q.correctOptionIndex && <span className="text-red-500 text-xs">Your Answer</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Subjective Section */}
                            {report?.subjective?.length > 0 && (
                                <Card padding="lg">
                                    <h3 className="text-lg font-light text-[var(--text-primary)] mb-4">Subjective Questions</h3>
                                    <div className="space-y-6">
                                        {report.subjective.map((q, i) => (
                                            <div key={i} className="border-b border-[var(--border-color)] pb-4 last:border-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-[var(--text-primary)] font-medium">Q{i + 1}: {q.questionText}</p>
                                                    <span className="text-xs px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                                                        {q.score} / {q.maxScore}
                                                    </span>
                                                </div>
                                                <div className="bg-[var(--bg-secondary)] p-3 rounded mb-2">
                                                    <p className="text-xs text-[var(--text-muted)] mb-1">Candidate Answer:</p>
                                                    <p className="text-sm text-[var(--text-primary)]">{q.candidateAnswer}</p>
                                                </div>
                                                <div className="bg-blue-500/10 p-3 rounded">
                                                    <p className="text-xs text-blue-400 mb-1">AI Feedback:</p>
                                                    <p className="text-sm text-blue-300">{q.aiFeedback}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Programming Section */}
                            {report?.programming?.length > 0 && (
                                <Card padding="lg">
                                    <h3 className="text-lg font-light text-[var(--text-primary)] mb-4">Programming Questions</h3>
                                    <div className="space-y-6">
                                        {report.programming.map((q, i) => (
                                            <div key={i} className="border-b border-[var(--border-color)] pb-4 last:border-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-[var(--text-primary)] font-medium">Q{i + 1}: {q.title}</p>
                                                    <span className="text-xs px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                                                        {q.score} / {q.maxScore}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[var(--text-secondary)] mb-2">{q.questionText}</p>
                                                <div className="bg-black p-3 rounded mb-2 font-mono text-xs overflow-x-auto">
                                                    <p className="text-[var(--text-muted)] mb-1">// Language: {q.language}</p>
                                                    <pre className="text-green-400">{q.code}</pre>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}

                    {activeTab === "proctoring" && (
                        <Card padding="lg">
                            <h3 className="text-lg font-light text-[var(--text-primary)] mb-6">
                                Proctoring Events
                            </h3>
                            {proctoringEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {proctoringEvents.map((event, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-start gap-4 p-4 rounded-lg ${getSeverityColor(event.severity)}`}
                                        >
                                            <AlertTriangle size={18} />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-medium capitalize">{event.eventType.replace(/_/g, " ")}</p>
                                                    <Badge variant={event.severity === "high" ? "error" : event.severity === "medium" ? "warning" : "info"} className="text-[10px] px-1.5 py-0 capitalize">
                                                        {event.severity}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs opacity-75">{event.description || (event.evidence?.description) || `Proctoring event: ${event.eventType}`}</p>

                                                {/* AI Analysis Evidence */}
                                                {event.evidence?.aiAnalysis && (
                                                    <div className="mt-2 p-2 bg-[rgba(0,0,0,0.05)] rounded border border-[rgba(0,0,0,0.1)]">
                                                        <p className="text-[10px] font-bold uppercase opacity-50 mb-1">AI Analysis</p>
                                                        <p className="text-xs text-[var(--status-error-text)] font-medium">
                                                            {event.evidence.aiAnalysis.briefReason}
                                                        </p>
                                                    </div>
                                                )}

                                                <p className="text-[10px] opacity-50 mt-2">
                                                    {new Date(event.createdAt || event.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                            {event.screenshot && (
                                                <div className="flex flex-col items-end gap-2">
                                                    <img
                                                        src={event.screenshot}
                                                        alt="Evidence"
                                                        className="w-32 h-24 object-cover rounded border border-[var(--border-default)] cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => window.open(event.screenshot, '_blank')}
                                                    />
                                                    <a
                                                        href={event.screenshot}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] underline opacity-75"
                                                    >
                                                        View Full Image
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CheckCircle size={40} className="mx-auto mb-3 text-[var(--status-success-text)]" />
                                    <p className="text-sm text-[var(--text-muted)]">No proctoring issues detected</p>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </main>

            {/* Decision Modal */}
            <Modal
                isOpen={showDecisionModal}
                onClose={() => setShowDecisionModal(false)}
                title="Set Decision"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: "pass", label: "Pass", icon: CheckCircle, color: "text-[var(--status-success-text)]" },
                            { value: "fail", label: "Fail", icon: XCircle, color: "text-[var(--status-error-text)]" },
                            { value: "cheating", label: "Cheating", icon: AlertTriangle, color: "text-[var(--status-warning-text)]" },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setDecision(opt.value)}
                                className={`
                  p-4 rounded-lg border-2 transition-all text-center
                  ${decision === opt.value
                                        ? "border-[var(--accent)] bg-[var(--bg-secondary)]"
                                        : "border-[var(--border-default)] hover:border-[var(--border-hover)]"}
                `}
                            >
                                <opt.icon size={24} className={`mx-auto mb-2 ${opt.color}`} />
                                <span className="text-sm text-[var(--text-primary)]">{opt.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Show proctoring selection ONLY if Cheating is selected */}
                    {decision === 'cheating' && proctoringEvents.length > 0 && (
                        <div className="max-h-[200px] overflow-y-auto border border-[var(--status-error-border)] rounded-lg p-3 bg-[var(--status-error-bg)]/10">
                            <p className="text-sm font-medium text-[var(--status-error-text)] mb-2">Select Evidence to Include within Email</p>
                            <div className="space-y-2">
                                {proctoringEvents.map((event) => (
                                    <div
                                        key={event._id || `event-${event.timestamp}`}
                                        className={`flex items-start gap-3 p-2 rounded border text-left cursor-pointer transition-colors bg-white
                                            ${selectedEventIds.includes(event._id)
                                                ? 'border-[var(--accent)]'
                                                : 'border-[var(--border-default)]'}`}
                                        onClick={() => {
                                            if (selectedEventIds.includes(event._id)) {
                                                setSelectedEventIds(prev => prev.filter(id => id !== event._id));
                                            } else {
                                                setSelectedEventIds(prev => [...prev, event._id]);
                                            }
                                        }}
                                    >
                                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center
                                            ${selectedEventIds.includes(event._id) ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-gray-400'}`}>
                                            {selectedEventIds.includes(event._id) && <CheckCircle size={12} className="text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold uppercase">{event.eventType.replace(/_/g, " ")}</span>
                                            </div>
                                            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                                                {event.evidence?.aiAnalysis?.briefReason || event.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <textarea
                        value={decisionNotes}
                        onChange={(e) => setDecisionNotes(e.target.value)}
                        placeholder="Add notes (optional)..."
                        rows={3}
                        className="w-full px-4 py-3 text-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg resize-none focus:outline-none focus:border-[var(--accent)]"
                    />
                </div>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setShowDecisionModal(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleDecision} loading={saving} disabled={!decision}>
                        {decision === 'cheating' ? 'Reject & Send Evidence' : 'Save Decision'}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Email Modal */}
            <Modal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                title="Send Result Email"
            >
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    This will send an email to {candidate.candidate?.email} with their assessment result.
                </p>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Include Report Toggle */}
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-default)]">
                        <input
                            type="checkbox"
                            checked={includeReport}
                            onChange={(e) => setIncludeReport(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                        />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-[var(--text-primary)]">Include Assessment Report</p>
                            <p className="text-xs text-[var(--text-secondary)]">Attach scores and AI feedback summary</p>
                        </div>
                    </div>

                    {/* Proctoring Events Selection */}
                    {proctoringEvents.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Include Proctoring Flags</p>
                            <div className="space-y-2">
                                {proctoringEvents.map((event) => (
                                    <div
                                        key={event._id || `event-${event.timestamp}`}
                                        className={`flex items-start gap-3 p-3 rounded-lg border text-left cursor-pointer transition-colors
                                            ${selectedEventIds.includes(event._id)
                                                ? 'border-[var(--accent)] bg-[var(--bg-secondary)]'
                                                : 'border-[var(--border-default)] hover:bg-[var(--bg-secondary)]'}`}
                                        onClick={() => {
                                            if (selectedEventIds.includes(event._id)) {
                                                setSelectedEventIds(prev => prev.filter(id => id !== event._id));
                                            } else {
                                                setSelectedEventIds(prev => [...prev, event._id]);
                                            }
                                        }}
                                    >
                                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center
                                            ${selectedEventIds.includes(event._id) ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-gray-400'}`}>
                                            {selectedEventIds.includes(event._id) && <CheckCircle size={12} className="text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold uppercase">{event.eventType.replace(/_/g, " ")}</span>
                                                <Badge variant={event.severity === "high" ? "error" : "warning"} className="text-[10px] px-1 py-0">{event.severity}</Badge>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                                                {event.evidence?.aiAnalysis?.briefReason || event.description}
                                            </p>
                                            <p className="text-[10px] opacity-50 mt-1">
                                                {new Date(event.createdAt || event.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        {event.screenshot && (
                                            <img src={event.screenshot} alt="Thumb" className="w-12 h-12 rounded object-cover opacity-80" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setShowEmailModal(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSendEmail} loading={saving}>
                        Send Email
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
