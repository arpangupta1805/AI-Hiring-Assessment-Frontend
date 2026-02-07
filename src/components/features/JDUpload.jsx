"use client";

import { useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * JDUpload Component
 * Allows file upload or text paste for Job Description
 */
export function JDUpload({ onSubmit, loading = false }) {
    const [mode, setMode] = useState("upload"); // "upload" or "paste"
    const [file, setFile] = useState(null);
    const [text, setText] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (isValidFile(droppedFile)) {
                setFile(droppedFile);
            }
        }
    };

    const isValidFile = (file) => {
        const validTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
        ];
        return validTypes.includes(file.type);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (isValidFile(selectedFile)) {
                setFile(selectedFile);
            }
        }
    };

    const handleSubmit = () => {
        if (mode === "upload" && file) {
            onSubmit({ file, text: "" });
        } else if (mode === "paste" && text.trim()) {
            onSubmit({ file: null, text: text.trim() });
        }
    };

    const canSubmit = (mode === "upload" && file) || (mode === "paste" && text.trim().length > 50);

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Mode Toggle */}
            <div className="flex items-center justify-center gap-1 p-1 mb-6 bg-[var(--bg-secondary)] rounded-lg">
                <button
                    onClick={() => setMode("upload")}
                    className={`flex-1 py-2 px-4 text-sm rounded-md transition-all duration-150 ${mode === "upload"
                            ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                >
                    Upload File
                </button>
                <button
                    onClick={() => setMode("paste")}
                    className={`flex-1 py-2 px-4 text-sm rounded-md transition-all duration-150 ${mode === "paste"
                            ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                >
                    Paste Text
                </button>
            </div>

            {/* Upload Mode */}
            {mode === "upload" && (
                <div
                    className={`
            relative border-2 border-dashed rounded-xl p-12
            transition-all duration-200 cursor-pointer
            ${dragActive
                            ? "border-[var(--accent)] bg-[var(--bg-secondary)]"
                            : "border-[var(--border-default)] hover:border-[var(--border-hover)]"
                        }
            ${file ? "bg-[var(--bg-secondary)]" : ""}
          `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center text-center">
                        {file ? (
                            <>
                                <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-lg bg-[var(--bg-hover)]">
                                    <FileText size={24} className="text-[var(--text-secondary)]" />
                                </div>
                                <p className="text-[var(--text-primary)] font-normal mb-1">
                                    {file.name}
                                </p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                    className="mt-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
                                >
                                    Remove file
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-lg bg-[var(--bg-hover)]">
                                    <Upload size={24} className="text-[var(--text-secondary)]" />
                                </div>
                                <p className="text-[var(--text-primary)] mb-1">
                                    Drop your JD file here, or click to browse
                                </p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Supports PDF, DOC, DOCX, TXT
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Paste Mode */}
            {mode === "paste" && (
                <div className="relative">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your job description here..."
                        className="
              w-full h-64 p-4 text-sm
              bg-[var(--bg-elevated)] text-[var(--text-primary)]
              border border-[var(--border-default)] rounded-xl
              resize-none
              transition-all duration-150
              hover:border-[var(--border-hover)]
              focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 focus:outline-none
              placeholder:text-[var(--text-muted)]
            "
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-[var(--text-muted)]">
                        {text.length} characters
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <div className="mt-6 flex justify-center">
                <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    loading={loading}
                >
                    Generate Assessment
                </Button>
            </div>
        </div>
    );
}
