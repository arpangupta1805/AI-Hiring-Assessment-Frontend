"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, Button } from "@/components/ui";
import { Clock, Monitor, Camera, AlertTriangle } from "lucide-react";

export default function InstructionsPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(false);
    const [candidateAssessmentId, setCandidateAssessmentId] = useState(null);
    const [assessmentInfo, setAssessmentInfo] = useState(null);

    useEffect(() => {
        const id = sessionStorage.getItem("candidateAssessmentId");
        if (!id) {
            router.push(`/assess/${params.link}`);
        } else {
            setCandidateAssessmentId(id);
            fetchInfo(id);
        }
    }, [params.link, router]);

    const fetchInfo = async (id) => {
        try {
            const response = await api.getCandidateStatus(id);
            if (response.success) {
                setAssessmentInfo(response.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleStart = async () => {
        if (!candidateAssessmentId) return;

        setLoading(true);
        try {
            const response = await api.startAssessment(candidateAssessmentId);
            if (response.success && response.data?.sessionToken) {
                // Save session token for use by test page
                sessionStorage.setItem("sessionToken", response.data.sessionToken);
                router.push(`/assess/${params.link}/test`);
            } else {
                console.error("No session token received from startAssessment");
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const rules = [
        {
            icon: Clock,
            title: "Time Limit",
            description: `You have ${assessmentInfo?.totalTimeMinutes || 90} minutes to complete the assessment. The timer starts once you begin.`,
        },
        {
            icon: Monitor,
            title: "Fullscreen Mode",
            description: "The assessment must be completed in fullscreen mode. Exiting fullscreen will be recorded.",
        },
        {
            icon: Camera,
            title: "Proctoring",
            description: "Your camera will remain active. Face detection and behavior monitoring are in place.",
        },
        {
            icon: AlertTriangle,
            title: "No External Help",
            description: "Do not switch tabs, use external resources, or have anyone else in view during the assessment.",
        },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
            <div className="w-full max-w-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-light text-[var(--text-primary)] mb-2">
                        Assessment Instructions
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Please read carefully before starting
                    </p>
                </div>

                <Card padding="lg">
                    <div className="space-y-6 mb-8">
                        {rules.map((rule, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0">
                                    <rule.icon size={20} className="text-[var(--text-secondary)]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">
                                        {rule.title}
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {rule.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-[var(--border-default)] pt-6">
                        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 mb-6">
                            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                                Assessment Structure
                            </h4>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-lg font-light text-[var(--text-primary)]">
                                        {assessmentInfo?.sections?.objective?.enabled ? assessmentInfo?.sections?.objective?.questionCount : 0}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">MCQ Questions</p>
                                </div>
                                <div>
                                    <p className="text-lg font-light text-[var(--text-primary)]">
                                        {assessmentInfo?.sections?.subjective?.enabled ? assessmentInfo?.sections?.subjective?.questionCount : 0}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">Written Questions</p>
                                </div>
                                <div>
                                    <p className="text-lg font-light text-[var(--text-primary)]">
                                        {assessmentInfo?.sections?.programming?.enabled ? assessmentInfo?.sections?.programming?.questionCount : 0}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">Coding Problems</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-[var(--text-muted)] mb-6 text-center">
                            By clicking "Start Assessment", you confirm that you have read and understood these instructions.
                        </p>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleStart}
                            loading={loading}
                        >
                            Start Assessment
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
