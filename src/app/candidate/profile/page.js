"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Header, Footer } from "@/components/layout";
import { Card, Button, Input, Badge, Modal, ModalFooter } from "@/components/ui";
import { User, Mail, Key, FileText, Clock, ChevronRight, CheckCircle, XCircle, Lock } from "lucide-react";
import Link from "next/link";

function CandidateProfileContent() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Profile form
    const [profileData, setProfileData] = useState({
        username: "",
        name: "",
        email: "",
    });

    // Password form
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username || "",
                name: user.name || "",
                email: user.email || "",
            });
        }
        fetchHistory();
    }, [user]);

    const fetchHistory = async () => {
        try {
            const response = await api.getCandidateAssessmentHistory();
            if (response.success) {
                setAssessments(response.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        // Validate username
        if (profileData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(profileData.username)) {
            setError("Username must be 3-20 characters, only letters, numbers, and underscores");
            setSaving(false);
            return;
        }

        try {
            await api.updateCandidateProfile({
                username: profileData.username,
                name: profileData.name,
            });
            setSuccess("Profile updated successfully");
            refreshUser();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await api.changePassword(passwordData.currentPassword, passwordData.newPassword);
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setSuccess("Password changed successfully");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getResultBadge = (assessment) => {
        if (!assessment.resultReleased) {
            return <Badge variant="info">Pending Review</Badge>;
        }
        if (assessment.adminDecision === "pass") {
            return <Badge variant="success">Passed</Badge>;
        }
        if (assessment.adminDecision === "fail") {
            return <Badge variant="error">Not Selected</Badge>;
        }
        return <Badge variant="warning">Under Review</Badge>;
    };

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
            <Header showNav={false} />

            <main className="flex-1 pt-24 pb-12 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-light text-[var(--text-primary)] mb-2">
                            My Profile
                        </h1>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Manage your account and view your assessment history
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-[var(--status-success-bg)] text-[var(--status-success-text)] rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Profile Card */}
                        <div className="lg:col-span-2">
                            <Card padding="lg">
                                <h2 className="text-lg font-light text-[var(--text-primary)] mb-6">
                                    Account Information
                                </h2>

                                <form onSubmit={handleProfileUpdate} className="space-y-5">
                                    {/* Username (customizable) */}
                                    <div>
                                        <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                            Username <span className="text-[var(--text-muted)]">(you can customize)</span>
                                        </label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                            <input
                                                type="text"
                                                value={profileData.username}
                                                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                                placeholder="Choose a username"
                                                className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg focus:border-[var(--accent)] focus:outline-none placeholder:text-[var(--text-muted)]"
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            3-20 characters, letters, numbers, and underscores only
                                        </p>
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
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg focus:border-[var(--accent)] focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Email (read-only) */}
                                    <div>
                                        <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                readOnly
                                                className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-default)] rounded-lg cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-4">
                                        <Button type="submit" loading={saving}>
                                            Save Changes
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setShowPasswordModal(true)}
                                        >
                                            <Key size={16} />
                                            Change Password
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </div>

                        {/* Stats Card */}
                        <div>
                            <Card padding="lg">
                                <h2 className="text-lg font-light text-[var(--text-primary)] mb-4">
                                    Overview
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
                                            <FileText size={20} className="text-[var(--text-secondary)]" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-light text-[var(--text-primary)]">
                                                {assessments.length}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">Assessments Taken</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
                                            <CheckCircle size={20} className="text-[var(--status-success-text)]" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-light text-[var(--text-primary)]">
                                                {assessments.filter((a) => a.adminDecision === "pass" && a.resultReleased).length}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">Passed</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Assessment History */}
                    <div className="mt-8">
                        <h2 className="text-lg font-light text-[var(--text-primary)] mb-4">
                            Assessment History
                        </h2>

                        {loading ? (
                            <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
                        ) : assessments.length === 0 ? (
                            <Card padding="lg" className="text-center py-8">
                                <FileText size={40} className="mx-auto mb-3 text-[var(--text-muted)]" />
                                <p className="text-[var(--text-muted)]">No assessments taken yet</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {assessments.map((assessment) => (
                                    <Card key={assessment._id} padding="lg">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-sm font-normal text-[var(--text-primary)]">
                                                        {assessment.companyName || "Company"}
                                                    </h3>
                                                    {getResultBadge(assessment)}
                                                </div>
                                                <p className="text-sm text-[var(--text-secondary)] mb-2">
                                                    {assessment.roleTitle || "Role"}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    Taken on {formatDate(assessment.submittedAt)}
                                                </p>
                                            </div>

                                            {/* Show details only if result is released by recruiter */}
                                            {assessment.resultReleased ? (
                                                <div className="text-right">
                                                    {assessment.totalScore != null && (
                                                        <p className="text-lg font-light text-[var(--text-primary)]">
                                                            {assessment.totalScore}%
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-[var(--text-muted)]">Score</p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                                    <Lock size={16} />
                                                    <span className="text-xs">Awaiting Review</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Questions & Responses - Only if result released */}
                                        {assessment.resultReleased && assessment.showDetails && (
                                            <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                                                <p className="text-xs text-[var(--text-muted)] mb-2">Section Scores</p>
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    {assessment.sectionScores &&
                                                        Object.entries(assessment.sectionScores).map(([section, score]) => (
                                                            <div key={section}>
                                                                <p className="text-sm text-[var(--text-primary)]">{score}%</p>
                                                                <p className="text-xs text-[var(--text-muted)] capitalize">{section}</p>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            {/* Password Change Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                title="Change Password"
            >
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <Input
                        label="Current Password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    />
                    <Input
                        label="New Password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                    <ModalFooter>
                        <Button type="button" variant="secondary" onClick={() => setShowPasswordModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving}>
                            Update Password
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>
        </div>
    );
}

export default function CandidateProfilePage() {
    return (
        <ProtectedRoute allowedRoles={["candidate"]}>
            <CandidateProfileContent />
        </ProtectedRoute>
    );
}
