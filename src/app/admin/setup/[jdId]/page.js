"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Header } from "@/components/layout";
import { Button, Input, Card, Modal, ModalFooter, Badge } from "@/components/ui";
import { Copy, Check, ExternalLink, Info, Shield, AlertTriangle, Eye, Edit2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default function SetupPage() {
    const router = useRouter();
    const params = useParams();
    const [jd, setJd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");
    const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

    // UI State for modals/info
    const [showResumeLogic, setShowResumeLogic] = useState(false);

    // Config state
    const [config, setConfig] = useState({
        instructions: "",
        cutoffScore: 60,
        resumeMatchThreshold: 90,
        startTime: "",
        endTime: "",
        totalTimeMinutes: 90,
        sections: {
            objective: { enabled: true, questionCount: 20, timeMinutes: 30, weight: 30 },
            subjective: { enabled: true, questionCount: 5, timeMinutes: 30, weight: 30 },
            programming: { enabled: true, questionCount: 2, timeMinutes: 30, weight: 40 },
        },
        numberOfSets: 3,
        difficultyDistribution: {
            easy: 20,
            medium: 50,
            hard: 30
        }
    });

    // Editable state for huge text fields
    const [rubrics, setRubrics] = useState("");
    const [showRubricPreview, setShowRubricPreview] = useState(false);
    const [skills, setSkills] = useState([]);

    useEffect(() => {
        fetchJD();
    }, [params.jdId]);

    const fetchJD = async () => {
        try {
            const response = await api.getJD(params.jdId);
            if (response.success) {
                setJd(response.data);
                // Merge existing config
                if (response.data.assessmentConfig) {
                    setConfig((prev) => ({
                        ...prev,
                        ...response.data.assessmentConfig,
                        // Ensure defaults if missing
                        difficultyDistribution: response.data.assessmentConfig.difficultyDistribution || {
                            easy: 20, medium: 50, hard: 30
                        }
                    }));
                }

                // Set editable fields
                setRubrics(response.data.evaluationRubrics || "");
                setSkills(response.data.parsedContent?.technicalSkills || []);

                if (response.data.assessmentConfig?.assessmentLink) {
                    setGeneratedLink(
                        `${window.location.origin}/assess/${response.data.assessmentConfig.assessmentLink}`
                    );
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfigChange = (field, value) => {
        setConfig((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleDifficultyChange = (level, value) => {
        setConfig((prev) => ({
            ...prev,
            difficultyDistribution: {
                ...prev.difficultyDistribution,
                [level]: parseInt(value) || 0
            }
        }));
    };

    const handleSectionChange = (section, field, value) => {
        setConfig((prev) => ({
            ...prev,
            sections: {
                ...prev.sections,
                [section]: {
                    ...prev.sections[section],
                    [field]: value,
                },
            },
        }));
    };

    const handleSkillWeightChange = (index, newWeight) => {
        const updatedSkills = [...skills];
        updatedSkills[index] = { ...updatedSkills[index], weight: parseInt(newWeight) };
        setSkills(updatedSkills);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Update Config
            await api.updateJDConfig(params.jdId, config);

            // 2. Update Skills (if changed)
            if (skills.length > 0) {
                await api.updateJDSkills(params.jdId, { technicalSkills: skills });
            }

            // 3. Update Rubrics
            await api.updateJDRubrics(params.jdId, { evaluationRubrics: rubrics });

            // Show success feedback
            setToast({ message: "Configuration saved successfully!", type: "success" });
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateLink = async () => {
        setGenerating(true);
        setError("");
        try {
            // Save everything first
            await handleSave();

            // Validate time
            if (!config.startTime || !config.endTime) {
                throw new Error("Start time and End time are required");
            }

            // Generate link (Now handles question generation synchronously)
            const response = await api.generateAssessmentLink(params.jdId, {
                startTime: config.startTime,
                endTime: config.endTime,
            });

            if (response.success) {
                const link = `${window.location.origin}/assess/${response.data.assessmentLink}`;
                setGeneratedLink(link);
                setShowLinkModal(true);
                // Refresh JD data to get locked status and other updates
                fetchJD();
            }
        } catch (err) {
            setError(err.message || "Failed to generate assessment link");
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const skillsByCategory = skills.reduce((acc, skill) => {
        const category = skill.category || "Other";
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
    }, {}) || {};

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-[var(--text-muted)]">Loading...</div>
            </div>
        );
    }

    // Calculate total difficulty %
    const totalDifficulty =
        (config.difficultyDistribution?.easy || 0) +
        (config.difficultyDistribution?.medium || 0) +
        (config.difficultyDistribution?.hard || 0);

    // Helper to format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatForDateTimeLocal = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";

        const pad = (num) => String(num).padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header showNav={false} />

            <main className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-light text-[var(--text-primary)] mb-2">
                                Assessment Configuration
                            </h1>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {jd?.parsedContent?.roleTitle || "Configure your assessment settings"}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="secondary" onClick={handleSave} loading={saving}>
                                Save Changes
                            </Button>
                            <Button onClick={handleGenerateLink} loading={generating}>
                                {generatedLink ? "Regenerate Link" : "Generate Assessment Link"}
                            </Button>
                        </div>
                    </div>

                    {/* Generating Overlay - Full screen blocking overlay with clear message */}
                    {generating && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                            <div className="bg-[var(--bg-elevated)] rounded-xl p-8 max-w-md text-center shadow-2xl border border-[var(--border-default)]">
                                <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                                <h3 className="text-xl font-medium text-[var(--text-primary)] mb-3">
                                    Generating Question Sets
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-4">
                                    This may take 30-60 seconds. Please do not refresh or close this page.
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    AI is creating unique questions based on your JD and rubrics...
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Left Configuration Panel */}
                        <div className="lg:col-span-7 space-y-6">

                            {/* 1. General Settings */}
                            <Card padding="lg">
                                <h2 className="text-lg font-light text-[var(--text-primary)] mb-6 flex items-center gap-2">
                                    General Settings
                                </h2>

                                {/* Instructions */}
                                <div className="mb-6">
                                    <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                        Instructions for Candidates
                                    </label>
                                    <textarea
                                        value={config.instructions || ""}
                                        onChange={(e) => handleConfigChange("instructions", e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg resize-none focus:border-[var(--accent)] focus:outline-none"
                                        placeholder="Enter assessment instructions..."
                                    />
                                </div>

                                {/* Time Settings */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <Input
                                        label="Start Time"
                                        type="datetime-local"
                                        value={formatForDateTimeLocal(config.startTime)}
                                        onChange={(e) => handleConfigChange("startTime", e.target.value)}
                                    />
                                    <Input
                                        label="End Time"
                                        type="datetime-local"
                                        value={formatForDateTimeLocal(config.endTime)}
                                        onChange={(e) => handleConfigChange("endTime", e.target.value)}
                                    />
                                </div>

                                {/* Scoring & Thresholds */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <Input
                                        label="Cut-off Score (%)"
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={config.cutoffScore}
                                        onChange={(e) => handleConfigChange("cutoffScore", parseInt(e.target.value))}
                                    />
                                    <div className="relative">
                                        <Input
                                            label="Resume Match Threshold (%)"
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={config.resumeMatchThreshold}
                                            onChange={(e) => handleConfigChange("resumeMatchThreshold", parseInt(e.target.value))}
                                        />
                                        <button
                                            onClick={() => setShowResumeLogic(!showResumeLogic)}
                                            className="absolute top-0 right-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs flex items-center gap-1"
                                        >
                                            <Info size={12} /> Logic
                                        </button>
                                        {showResumeLogic && (
                                            <div className="absolute z-10 top-full mt-2 right-0 w-64 p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg shadow-xl text-xs text-[var(--text-secondary)]">
                                                <p className="mb-2 font-medium text-[var(--text-primary)]">Resume Matching Logic</p>
                                                <p>Candidates scoring below this % in resume screening will be auto-filtered. This score is calculated based on skill overlap, experience relevance, and keyword matching from the JD.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <Input
                                        label="Number of Question Sets"
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={config.numberOfSets}
                                        onChange={(e) => handleConfigChange("numberOfSets", parseInt(e.target.value))}
                                        helperText="Variations of the test generated to prevent cheating."
                                    />
                                </div>
                            </Card>

                            {/* 2. Section Configuration */}
                            <Card padding="lg">
                                <h2 className="text-lg font-light text-[var(--text-primary)] mb-6">
                                    Section Configuration
                                </h2>

                                <div className="space-y-4">
                                    {["objective", "subjective", "programming"].map((section) => (
                                        <div
                                            key={section}
                                            className="flex items-center justify-between py-4 border-b border-[var(--border-default)] last:border-0"
                                        >
                                            <div className="flex items-center gap-4 w-1/4">
                                                <input
                                                    type="checkbox"
                                                    checked={config.sections[section].enabled}
                                                    onChange={(e) => handleSectionChange(section, "enabled", e.target.checked)}
                                                    className="w-4 h-4 rounded border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                                />
                                                <span className="text-sm font-medium text-[var(--text-primary)] capitalize">
                                                    {section}
                                                </span>
                                            </div>

                                            <div className="flex gap-4 flex-1 justify-end">
                                                <div className="relative w-24">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={50}
                                                        value={config.sections[section].questionCount}
                                                        onChange={(e) => handleSectionChange(section, "questionCount", parseInt(e.target.value))}
                                                        className="text-center"
                                                        disabled={!config.sections[section].enabled}
                                                    />
                                                    <span className="absolute -bottom-5 left-0 w-full text-center text-[10px] text-[var(--text-muted)]">Count</span>
                                                </div>
                                                <div className="relative w-24">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={100}
                                                        value={config.sections[section].weight || 0}
                                                        onChange={(e) => handleSectionChange(section, "weight", parseInt(e.target.value))}
                                                        className="text-center"
                                                        disabled={!config.sections[section].enabled}
                                                    />
                                                    <span className="absolute -bottom-5 left-0 w-full text-center text-[10px] text-[var(--text-muted)]">Weight %</span>
                                                </div>
                                                <div className="relative w-24">
                                                    <Input
                                                        type="number"
                                                        min={5}
                                                        max={120}
                                                        value={config.sections[section].timeMinutes}
                                                        onChange={(e) => handleSectionChange(section, "timeMinutes", parseInt(e.target.value))}
                                                        className="text-center"
                                                        disabled={!config.sections[section].enabled}
                                                    />
                                                    <span className="absolute -bottom-5 left-0 w-full text-center text-[10px] text-[var(--text-muted)]">Mins</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* 3. Question Difficulty Distribution */}
                            <Card padding="lg">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-light text-[var(--text-primary)]">
                                        Difficulty Distribution
                                    </h2>
                                    {totalDifficulty !== 100 && (
                                        <Badge variant="warning">Total must be 100% (Current: {totalDifficulty}%)</Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {['easy', 'medium', 'hard'].map((level) => (
                                        <div key={level}>
                                            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase mb-2">
                                                {level}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="range"
                                                    min="0" max="100"
                                                    value={config.difficultyDistribution?.[level] || 0}
                                                    onChange={(e) => handleDifficultyChange(level, e.target.value)}
                                                    className="flex-1 h-2 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                                                />
                                                <span className="text-sm font-medium w-8">
                                                    {config.difficultyDistribution?.[level] || 0}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* 4. Integrity & Proctoring Rules (Read-Only) */}
                            <Card padding="lg">
                                <h2 className="text-lg font-light text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <Shield size={18} className="text-[var(--accent)]" />
                                    Integrity & Proctoring Rules
                                </h2>
                                <div className="bg-[var(--bg-secondary)] bg-opacity-50 p-4 rounded-lg border border-[var(--border-default)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Events Tracked</h4>
                                            <ul className="text-xs text-[var(--text-secondary)] space-y-1 list-disc pl-4">
                                                <li>Tab switching & browser focus loss</li>
                                                <li>Multiple faces detection (via webcam)</li>
                                                <li>Device & IP fingerprinting</li>
                                                <li>Copy/Paste actions</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Policy Summary</h4>
                                            <ul className="text-xs text-[var(--text-secondary)] space-y-1 list-disc pl-4">
                                                <li><span className="text-[var(--status-success-text)]">No auto-disqualification</span> occurs.</li>
                                                <li>All violations are flagged for manual review.</li>
                                                <li>Final decision rests with the recruiter.</li>
                                                <li>Candidates are warned before flagging.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Right: AI Insights & Content Panel */}
                        <div className="lg:col-span-5 space-y-6">

                            {/* 5. Skill Weights Configuration */}
                            <Card padding="lg">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-light text-[var(--text-primary)]">
                                        Skill Priorities
                                    </h2>
                                    <Badge variant="info">AI Extracted</Badge>
                                </div>

                                {Object.keys(skillsByCategory).length > 0 ? (
                                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                                            <div key={category}>
                                                <p className="text-xs font-semibold text-[var(--text-primary)] mb-3 bg-[var(--bg-secondary)] px-2 py-1 rounded inline-block">
                                                    {category}
                                                </p>
                                                <div className="space-y-3">
                                                    {categorySkills.map((skill, index) => {
                                                        // Find the global index in the main skills array
                                                        const globalIndex = skills.indexOf(skill);
                                                        return (
                                                            <div key={index} className="flex items-center gap-3 group">
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-sm text-[var(--text-secondary)]">{skill.name}</span>
                                                                        <span className="text-xs font-mono text-[var(--text-muted)]">{skill.weight}/10</span>
                                                                    </div>
                                                                    <input
                                                                        type="range"
                                                                        min="1" max="10"
                                                                        value={skill.weight}
                                                                        onChange={(e) => handleSkillWeightChange(globalIndex, e.target.value)}
                                                                        className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)] opacity-70 group-hover:opacity-100 transition-opacity"
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-[var(--text-muted)]">No skills found.</p>
                                )}
                            </Card>

                            {/* 5. Extracted JD Details (Restored) */}
                            <Card padding="lg">
                                <h2 className="text-lg font-light text-[var(--text-primary)] mb-6">
                                    Extracted Job Details
                                </h2>
                                <div className="space-y-4 text-sm text-[var(--text-secondary)]">
                                    <div>
                                        <span className="font-medium text-[var(--text-primary)]">Role Title:</span>{" "}
                                        {jd?.parsedContent?.roleTitle || "N/A"}
                                    </div>
                                    <div>
                                        <span className="font-medium text-[var(--text-primary)]">Company:</span>{" "}
                                        {jd?.parsedContent?.companyName || jd?.company?.name || "N/A"}
                                    </div>
                                    <div>
                                        <span className="font-medium text-[var(--text-primary)]">Key Responsibilities:</span>
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            {jd?.parsedContent?.keyResponsibilities?.slice(0, 3).map((resp, i) => (
                                                <li key={i}>{resp}</li>
                                            ))}
                                            {(jd?.parsedContent?.keyResponsibilities?.length || 0) > 3 && (
                                                <li className="text-[var(--text-muted)] italic">...and more</li>
                                            )}
                                        </ul>
                                    </div>
                                    {/* Refined JD Preview */}
                                    <div className="pt-4 border-t border-[var(--border-default)]">
                                        <p className="font-medium text-[var(--text-primary)] mb-2">Refined JD Summary</p>
                                        <div className="bg-[var(--bg-secondary)] p-3 rounded-lg text-xs leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                                {jd?.parsedContent?.refinedJD || "*No refined JD available*"}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* 6. Evaluation Rubrics (Editable with Preview) */}
                            <Card padding="lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-light text-[var(--text-primary)]">
                                        Evaluation Rubrics
                                    </h2>
                                    <div className="flex bg-[var(--bg-secondary)] rounded-lg p-1">
                                        <button
                                            onClick={() => setShowRubricPreview(false)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!showRubricPreview
                                                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                                }`}
                                        >
                                            <span className="flex items-center gap-1"><Edit2 size={12} /> Edit</span>
                                        </button>
                                        <button
                                            onClick={() => setShowRubricPreview(true)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${showRubricPreview
                                                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                                }`}
                                        >
                                            <span className="flex items-center gap-1"><Eye size={12} /> Preview</span>
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] mb-3">
                                    This human-readable guide is used by the AI to grade candidates. Edit to refine grading criteria.
                                </p>

                                {showRubricPreview ? (
                                    <div className="w-full px-4 py-3 min-h-[300px] bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg prose prose-sm prose-invert max-w-none custom-scrollbar overflow-y-auto">
                                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                            {rubrics || "*No rubrics defined*"}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <textarea
                                        value={rubrics}
                                        onChange={(e) => setRubrics(e.target.value)}
                                        rows={12}
                                        className="w-full px-4 py-3 text-xs font-mono bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg resize-none focus:border-[var(--accent)] focus:outline-none"
                                        placeholder="## Evaluation Criteria..."
                                    />
                                )}
                            </Card>

                            {/* Generated Link Display */}
                            {generatedLink && (
                                <Card padding="lg">
                                    <h2 className="text-lg font-light text-[var(--text-primary)] mb-4">
                                        Assessment Link
                                    </h2>
                                    <div className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <input
                                            type="text"
                                            value={generatedLink}
                                            readOnly
                                            className="flex-1 bg-transparent text-sm text-[var(--text-secondary)] outline-none"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                                        >
                                            {copied ? (
                                                <Check size={16} className="text-[var(--status-success-text)]" />
                                            ) : (
                                                <Copy size={16} className="text-[var(--text-secondary)]" />
                                            )}
                                        </button>
                                        <a
                                            href={generatedLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                                        >
                                            <ExternalLink size={16} className="text-[var(--text-secondary)]" />
                                        </a>
                                    </div>
                                </Card>
                            )}

                        </div>
                    </div>
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

            {/* Link Generated Modal - Kept same as before */}
            <Modal
                isOpen={showLinkModal}
                onClose={() => setShowLinkModal(false)}
                title="Assessment Link Generated"
                size="md"
            >
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-[var(--status-success-bg)]">
                        <Check size={32} className="text-[var(--status-success-text)]" />
                    </div>
                    <p className="text-[var(--text-secondary)] mb-6">
                        Your assessment is ready. Share this link with candidates.
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)] rounded-lg mb-6">
                        <input
                            type="text"
                            value={generatedLink}
                            readOnly
                            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none"
                        />
                        <button
                            onClick={copyToClipboard}
                            className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg text-sm"
                        >
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setShowLinkModal(false)}>
                        Close
                    </Button>
                    <Button onClick={() => router.push("/admin/dashboard")}>
                        Go to Dashboard
                    </Button>
                </ModalFooter>
            </Modal>
        </div >
    );
}
