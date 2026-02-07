"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button, Card, Badge } from "@/components/ui";
import { useProctoring } from "@/hooks/useProctoring";
import { useTimer } from "@/hooks/useTimer";
import { Clock, ChevronLeft, ChevronRight, Save, Send, Maximize } from "lucide-react";

const SECTIONS = ["objective", "subjective", "programming"];

export default function TestPage() {
    const router = useRouter();
    const params = useParams();
    const [candidateAssessmentId, setCandidateAssessmentId] = useState(null);
    const [currentSection, setCurrentSection] = useState("objective");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Sync current section and question index to sessionStorage for useProctoring
    useEffect(() => {
        sessionStorage.setItem("currentSection", currentSection);
        sessionStorage.setItem("currentQuestionIndex", currentQuestionIndex.toString());
    }, [currentSection, currentQuestionIndex]);
    const [questions, setQuestions] = useState({});
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Proctoring
    const { isFullscreen, enterFullscreen, logEvent } = useProctoring({
        candidateAssessmentId,
        enabled: true,
    });

    // Timer
    const { formatTime, isLowTime, start: startTimer } = useTimer(90, () => {
        handleSubmitAll();
    });

    useEffect(() => {
        const id = sessionStorage.getItem("candidateAssessmentId");
        const sessionToken = sessionStorage.getItem("sessionToken");
        if (!id || !sessionToken) {
            router.push(`/assess/${params.link}`);
            return;
        }
        setCandidateAssessmentId(id);
        loadQuestions();
        startTimer();

        // Enter fullscreen
        setTimeout(() => {
            enterFullscreen();
        }, 500);
    }, [params.link, router, startTimer, enterFullscreen]);

    const loadQuestions = async () => {
        try {
            const results = await Promise.all(
                SECTIONS.map((section) => api.getQuestions(section))
            );

            const questionsMap = {};
            SECTIONS.forEach((section, index) => {
                if (results[index].success) {
                    questionsMap[section] = results[index].data?.questions || [];
                } else {
                    questionsMap[section] = [];
                }
            });
            setQuestions(questionsMap);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const currentQuestions = questions[currentSection] || [];
    const currentQuestion = currentQuestions[currentQuestionIndex];

    const handleAnswer = (value) => {
        const key = `${currentSection}_${currentQuestionIndex}`;
        setAnswers((prev) => ({ ...prev, [key]: value }));
    };

    const getAnswer = () => {
        const key = `${currentSection}_${currentQuestionIndex}`;
        return answers[key] || "";
    };

    const handleSaveAnswer = async () => {
        if (!currentQuestion || !candidateAssessmentId) return;

        const answerValue = getAnswer();
        if (!answerValue) return; // Don't save empty answers

        setSaving(true);
        try {
            let answerData = {
                questionId: currentQuestion.questionId, // Use questionId, not _id
                section: currentSection,
            };

            // Format answer based on section type
            if (currentSection === 'objective') {
                // Find the index of the selected option
                const selectedIndex = currentQuestion.options?.findIndex(
                    opt => opt.text === answerValue
                );
                answerData.answer = {
                    selectedOptionIndex: selectedIndex >= 0 ? selectedIndex : -1,
                    selectedOptionText: answerValue,
                };
            } else if (currentSection === 'subjective') {
                answerData.answer = answerValue; // Text answer
            } else if (currentSection === 'programming') {
                answerData.code = answerValue; // Code answer
                answerData.language = 'python'; // Default language
                answerData.answer = answerValue; // Also include as answer
            }

            await api.saveAnswer(answerData);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        await handleSaveAnswer();

        if (currentQuestionIndex < currentQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // Move to next section
            const currentSectionIndex = SECTIONS.indexOf(currentSection);
            if (currentSectionIndex < SECTIONS.length - 1) {
                setCurrentSection(SECTIONS[currentSectionIndex + 1]);
                setCurrentQuestionIndex(0);
            }
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        } else {
            // Move to previous section
            const currentSectionIndex = SECTIONS.indexOf(currentSection);
            if (currentSectionIndex > 0) {
                const prevSection = SECTIONS[currentSectionIndex - 1];
                setCurrentSection(prevSection);
                setCurrentQuestionIndex((questions[prevSection]?.length || 1) - 1);
            }
        }
    };

    const handleSubmitAll = async () => {
        setSubmitting(true);
        try {
            // Save current answer first
            await handleSaveAnswer();

            // Submit assessment
            await api.submitAssessment(candidateAssessmentId);

            // Log completion
            logEvent("assessment_completed", {}, "low");

            // Navigate to completion page
            router.push(`/assess/${params.link}/complete`);
        } catch (err) {
            console.error(err);
            setSubmitting(false);
        }
    };

    const getTotalAnswered = () => {
        return Object.keys(answers).length;
    };

    const getTotalQuestions = () => {
        return SECTIONS.reduce((sum, section) => sum + (questions[section]?.length || 0), 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-[var(--text-muted)]">Loading assessment...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[var(--bg-elevated)] border-b border-[var(--border-default)] px-6 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    {/* Timer */}
                    <div className={`flex items-center gap-2 ${isLowTime ? "text-[var(--status-error-text)]" : "text-[var(--text-primary)]"}`}>
                        <Clock size={18} />
                        <span className="font-mono text-lg">{formatTime()}</span>
                        {isLowTime && <span className="text-xs">(Low time!)</span>}
                    </div>

                    {/* Section Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg">
                        {SECTIONS.map((section) => (
                            <button
                                key={section}
                                onClick={() => { setCurrentSection(section); setCurrentQuestionIndex(0); }}
                                className={`
                  px-4 py-1.5 text-sm rounded-md transition-all capitalize
                  ${currentSection === section
                                        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}
                `}
                            >
                                {section}
                            </button>
                        ))}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[var(--text-secondary)]">
                            {getTotalAnswered()}/{getTotalQuestions()} answered
                        </span>
                        {!isFullscreen && (
                            <button
                                onClick={enterFullscreen}
                                className="flex items-center gap-1 text-xs text-[var(--status-warning-text)] hover:underline"
                            >
                                <Maximize size={14} />
                                Enter Fullscreen
                            </button>
                        )}
                        <Button size="sm" onClick={handleSubmitAll} loading={submitting}>
                            <Send size={14} />
                            Submit
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    {currentQuestion ? (
                        <Card padding="lg">
                            {/* Question Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Badge variant="info" className="capitalize">{currentSection}</Badge>
                                    <span className="text-sm text-[var(--text-muted)]">
                                        Question {currentQuestionIndex + 1} of {currentQuestions.length}
                                    </span>
                                </div>
                                {saving && (
                                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                        <Save size={12} />
                                        Saving...
                                    </span>
                                )}
                            </div>

                            {/* Question Text */}
                            <div className="mb-8">
                                <h2 className="text-lg text-[var(--text-primary)] leading-relaxed">
                                    {currentQuestion.questionText}
                                </h2>
                            </div>

                            {/* Answer Area */}
                            <div className="mb-8">
                                {currentSection === "objective" ? (
                                    // MCQ Options
                                    <div className="space-y-3">
                                        {currentQuestion.options?.map((option, index) => (
                                            <label
                                                key={index}
                                                className={`
                          flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all
                          ${getAnswer() === option.text
                                                        ? "border-[var(--accent)] bg-[var(--bg-secondary)]"
                                                        : "border-[var(--border-default)] hover:border-[var(--border-hover)]"}
                        `}
                                            >
                                                <input
                                                    type="radio"
                                                    name="mcq"
                                                    value={option.text}
                                                    checked={getAnswer() === option.text}
                                                    onChange={() => handleAnswer(option.text)}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm text-[var(--text-primary)]">{option.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : currentSection === "subjective" ? (
                                    // Text Answer
                                    <textarea
                                        value={getAnswer()}
                                        onChange={(e) => handleAnswer(e.target.value)}
                                        rows={8}
                                        placeholder="Type your answer here..."
                                        className="w-full px-4 py-3 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg resize-none focus:border-[var(--accent)] focus:outline-none"
                                    />
                                ) : (
                                    // Code Editor (simplified)
                                    <div>
                                        <div className="mb-4">
                                            <label className="text-sm text-[var(--text-secondary)]">
                                                Language: {currentQuestion.language || "Any"}
                                            </label>
                                        </div>
                                        <textarea
                                            value={getAnswer()}
                                            onChange={(e) => handleAnswer(e.target.value)}
                                            rows={16}
                                            placeholder="// Write your code here..."
                                            className="w-full px-4 py-3 font-mono text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg resize-none focus:border-[var(--accent)] focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between pt-6 border-t border-[var(--border-default)]">
                                <Button
                                    variant="ghost"
                                    onClick={handlePrev}
                                    disabled={currentQuestionIndex === 0 && currentSection === SECTIONS[0]}
                                >
                                    <ChevronLeft size={18} />
                                    Previous
                                </Button>

                                {/* Question Dots */}
                                <div className="flex items-center gap-1">
                                    {currentQuestions.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentQuestionIndex(index)}
                                            className={`
                        w-2 h-2 rounded-full transition-all
                        ${index === currentQuestionIndex
                                                    ? "bg-[var(--accent)] w-6"
                                                    : answers[`${currentSection}_${index}`]
                                                        ? "bg-[var(--accent)]/50"
                                                        : "bg-[var(--border-default)]"}
                      `}
                                        />
                                    ))}
                                </div>

                                <Button onClick={handleNext}>
                                    {currentQuestionIndex === currentQuestions.length - 1 &&
                                        currentSection === SECTIONS[SECTIONS.length - 1]
                                        ? "Review & Submit"
                                        : "Next"}
                                    <ChevronRight size={18} />
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <Card padding="lg" className="text-center py-12">
                            <p className="text-[var(--text-muted)]">
                                No questions available for this section
                            </p>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
