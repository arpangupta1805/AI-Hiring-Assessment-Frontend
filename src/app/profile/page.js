"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Header, Footer } from "@/components/layout";
import { Card, Button, Input, Badge, Modal, ModalFooter } from "@/components/ui";
import { User, Mail, Building, Key, FileText, Users, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

function RecruiterProfileContent() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [jds, setJds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Profile form
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        companyName: "",
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
                name: user.name || "",
                email: user.email || "",
                companyName: user.company?.name || "",
            });
            fetchJDs();
        }
    }, [user]);

    const fetchJDs = async () => {
        try {
            const response = await api.getJDs();
            if (response.success) {
                setJds(response.data || []);
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

        try {
            await api.updateProfile({
                name: profileData.name,
                companyName: profileData.companyName,
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

    const generateUsername = () => {
        if (user?.id) {
            return `recruiter_${user.id.slice(-8)}`;
        }
        return "recruiter_unknown";
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
                <div className="max-w-5xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-light text-[var(--text-primary)] mb-2">
                            Profile Settings
                        </h1>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Manage your account and view your assessments
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
                                    {/* Username (read-only) */}
                                    <div>
                                        <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                            Username <span className="text-[var(--text-muted)]">(auto-generated)</span>
                                        </label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                            <input
                                                type="text"
                                                value={generateUsername()}
                                                readOnly
                                                className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-default)] rounded-lg cursor-not-allowed"
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            Your username is automatically assigned and cannot be changed
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

                                    {/* Company */}
                                    <div>
                                        <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                            Company Name
                                        </label>
                                        <div className="relative">
                                            <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                            <input
                                                type="text"
                                                value={profileData.companyName}
                                                onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg focus:border-[var(--accent)] focus:outline-none"
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
                                                {jds.length}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">Job Descriptions</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
                                            <Users size={20} className="text-[var(--text-secondary)]" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-light text-[var(--text-primary)]">
                                                {jds.reduce((sum, jd) => sum + (jd.candidateCount || 0), 0)}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">Total Candidates</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Recent JDs */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-light text-[var(--text-primary)]">
                                Your Assessments
                            </h2>
                            <Link
                                href="/admin/dashboard"
                                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                                View All →
                            </Link>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
                        ) : jds.length === 0 ? (
                            <Card padding="lg" className="text-center py-8">
                                <p className="text-[var(--text-muted)]">No assessments yet</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {jds.slice(0, 5).map((jd) => (
                                    <Card key={jd._id} padding="none" hover>
                                        <Link href={`/admin/dashboard/${jd._id}`}>
                                            <div className="p-4 flex items-center gap-4">
                                                <div className="flex-1">
                                                    <p className="text-sm font-normal text-[var(--text-primary)]">
                                                        {jd.parsedContent?.roleTitle || "Untitled Role"}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                                                        <span className="flex items-center gap-1">
                                                            <Users size={12} />
                                                            {jd.candidateCount || 0} candidates
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {formatDate(jd.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} className="text-[var(--text-muted)]" />
                                            </div>
                                        </Link>
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

export default function RecruiterProfilePage() {
    return (
        <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterProfileContent />
        </ProtectedRoute>
    );
}
