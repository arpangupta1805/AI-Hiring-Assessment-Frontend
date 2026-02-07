"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, Button } from "@/components/ui";
import { Upload, FileText, Check, X, AlertCircle } from "lucide-react";

export default function ResumePage() {
    const router = useRouter();
    const params = useParams();
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null); // { eligible: boolean, message?: string }
    const [error, setError] = useState("");
    const [candidateAssessmentId, setCandidateAssessmentId] = useState(null);

    useEffect(() => {
        const id = sessionStorage.getItem("candidateAssessmentId");
        if (!id) {
            router.push(`/assess/${params.link}`);
        } else {
            setCandidateAssessmentId(id);
        }
    }, [params.link, router]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Validate file type
            const validTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "text/plain",
            ];
            if (!validTypes.includes(selectedFile.type)) {
                setError("Please upload a PDF, DOC, DOCX, or TXT file");
                return;
            }
            // Validate file size (5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError("File size must be less than 5MB");
                return;
            }
            setFile(selectedFile);
            setError("");
        }
    };

    const handleUpload = async () => {
        if (!file || !candidateAssessmentId) return;

        setUploading(true);
        setError("");

        try {
            const response = await api.uploadResume(candidateAssessmentId, file);
            setUploading(false);

            if (response.success) {
                setResult({
                    eligible: response.data.resume?.passedThreshold,
                    matchScore: response.data.resume?.matchScore,
                });
            } else {
                setError(response.error || "Failed to analyze resume");
            }
        } catch (err) {
            setError(err.message || "Failed to upload resume");
            setUploading(false);
        }
    };

    const handleContinue = () => {
        if (result?.eligible) {
            router.push(`/assess/${params.link}/instructions`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-light text-[var(--text-primary)] mb-2">
                        Resume Upload
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Upload your resume for evaluation
                    </p>
                </div>

                <Card padding="lg">
                    {error && (
                        <div className="mb-4 p-3 bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Upload State */}
                    {!result && !uploading && (
                        <div>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                  transition-all duration-200
                  ${file
                                        ? "border-[var(--accent)] bg-[var(--bg-secondary)]"
                                        : "border-[var(--border-default)] hover:border-[var(--border-hover)]"}
                `}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <FileText size={32} className="mb-3 text-[var(--text-secondary)]" />
                                        <p className="text-sm text-[var(--text-primary)] mb-1">{file.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            className="mt-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload size={32} className="mb-3 text-[var(--text-muted)]" />
                                        <p className="text-sm text-[var(--text-primary)] mb-1">
                                            Click to upload your resume
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            PDF, DOC, DOCX, or TXT (max 5MB)
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full mt-6"
                                onClick={handleUpload}
                                disabled={!file}
                                loading={uploading}
                            >
                                Upload Resume
                            </Button>
                        </div>
                    )}

                    {/* Processing State */}
                    {uploading && (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-[var(--text-primary)] mb-1">Analyzing your resume...</p>
                            <p className="text-sm text-[var(--text-muted)]">This may take a moment</p>
                        </div>
                    )}

                    {/* Result State */}
                    {result && (
                        <div className="text-center py-6">
                            {result.eligible ? (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-[var(--status-success-bg)] flex items-center justify-center mx-auto mb-4">
                                        <Check size={32} className="text-[var(--status-success-text)]" />
                                    </div>
                                    <h3 className="text-lg font-light text-[var(--text-primary)] mb-2">
                                        You are Eligible
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)] mb-6">
                                        Your profile matches the requirements. You may proceed with the assessment.
                                    </p>
                                    <Button className="w-full" onClick={handleContinue}>
                                        Continue to Instructions
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-[var(--status-error-bg)] flex items-center justify-center mx-auto mb-4">
                                        <X size={32} className="text-[var(--status-error-text)]" />
                                    </div>
                                    <h3 className="text-lg font-light text-[var(--text-primary)] mb-2">
                                        Not Eligible
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Your profile does not meet the minimum requirements for this role.
                                        Thank you for your interest.
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
