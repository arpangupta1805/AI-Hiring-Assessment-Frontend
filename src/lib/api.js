/**
 * API Client
 * Centralized API communication with the backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    // Get auth token from localStorage
    getToken() {
        if (typeof window !== "undefined") {
            return localStorage.getItem("token");
        }
        return null;
    }

    // Set auth token
    setToken(token) {
        if (typeof window !== "undefined") {
            localStorage.setItem("token", token);
        }
    }

    // Remove auth token
    removeToken() {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
        }
    }

    // Build headers
    getHeaders(includeAuth = true, isFormData = false, useSession = false) {
        const headers = {};

        if (!isFormData) {
            headers["Content-Type"] = "application/json";
        }

        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
        }

        // Add session token for assessment execution APIs
        if (useSession && typeof window !== "undefined") {
            const sessionToken = sessionStorage.getItem("sessionToken");
            console.log("[API Debug] useSession=true, sessionToken exists:", !!sessionToken);
            if (sessionToken) {
                headers["x-session-token"] = sessionToken;
            }
        }

        return headers;
    }

    // Make API request
    async request(endpoint, options = {}) {
        const {
            method = "GET",
            body,
            auth = true,
            isFormData = false,
            useSession = false,
            silent = false,
        } = options;

        const config = {
            method,
            headers: this.getHeaders(auth, isFormData, useSession),
            cache: 'no-store', // Disable caching to ensure fresh data
        };

        if (body) {
            config.body = isFormData ? body : JSON.stringify(body);
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || data.message || (data.errors ? JSON.stringify(data.errors) : "Request failed");
                if (silent) {
                    console.warn(`API Warning [${method} ${endpoint}]:`, errorMessage);
                    return { success: false, error: errorMessage };
                }
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            if (silent) {
                console.warn(`API Warning [${method} ${endpoint}]:`, error.message);
                return { success: false, error: error.message };
            }
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // =========================================================================
    // AUTH
    // =========================================================================

    async sendOTP(email) {
        return this.request("/api/auth/send-otp", {
            method: "POST",
            body: { email },
            auth: false,
        });
    }

    async verifyOTP(email, otp) {
        return this.request("/api/auth/verify-otp", {
            method: "POST",
            body: { email, otp },
            auth: false,
        });
    }

    async login(email, password) {
        const response = await this.request("/api/auth/login", {
            method: "POST",
            body: { email, password },
            auth: false,
        });
        // Token is inside data.token (backend returns { success, data: { token, user } })
        if (response.data?.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async signupRecruiter(data) {
        const response = await this.request("/api/auth/signup/recruiter", {
            method: "POST",
            body: data,
            auth: false,
        });
        // Save token after signup
        if (response.data?.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async getCurrentUser() {
        return this.request("/api/auth/me");
    }

    async updateProfile(data) {
        return this.request("/api/auth/profile", {
            method: "PUT",
            body: data,
        });
    }

    async changePassword(currentPassword, newPassword) {
        return this.request("/api/auth/change-password", {
            method: "POST",
            body: { currentPassword, newPassword },
        });
    }

    logout() {
        this.removeToken();
    }

    // =========================================================================
    // JOB DESCRIPTIONS
    // =========================================================================

    async uploadJD(rawText, file = null) {
        // If file is provided, try to read its text content
        if (file) {
            // For text files, read content directly
            if (file.type === "text/plain" || file.name.endsWith(".txt")) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const text = e.target.result;
                            const response = await this.request("/api/jd/upload", {
                                method: "POST",
                                body: { jdText: text },
                            });
                            resolve(response);
                        } catch (err) {
                            reject(err);
                        }
                    };
                    reader.onerror = () => reject(new Error("Failed to read file"));
                    reader.readAsText(file);
                });
            }

            // For PDF/DOC files, we need server-side parsing
            // For now, show a helpful error
            // TODO: Add server-side file upload + parsing
            throw new Error("PDF/DOC files are not yet supported. Please paste the text content instead.");
        }

        // Text-only submission
        return this.request("/api/jd/upload", {
            method: "POST",
            body: { jdText: rawText },
        });
    }

    async parseJD(jdId) {
        return this.request(`/api/jd/${jdId}/parse`, {
            method: "POST",
        });
    }

    async getJD(jdId) {
        return this.request(`/api/jd/${jdId}`);
    }

    async deleteJD(jdId) {
        return this.request(`/api/jd/${jdId}`, {
            method: "DELETE",
        });
    }

    async updateJDConfig(jdId, config) {
        return this.request(`/api/jd/${jdId}/config`, {
            method: "PUT",
            body: config,
        });
    }

    async updateJDSkills(jdId, data) {
        return this.request(`/api/jd/${jdId}/skills`, {
            method: "PUT",
            body: data,
        });
    }

    async updateJDRubrics(jdId, data) {
        return this.request(`/api/jd/${jdId}/rubrics`, {
            method: "PUT",
            body: data,
        });
    }

    async generateAssessmentLink(jdId, data = {}) {
        return this.request(`/api/jd/${jdId}/generate-link`, {
            method: "POST",
            body: data
        });
    }

    async generateQuestions(jdId, options = {}) {
        return this.request(`/api/jd/${jdId}/generate-questions`, {
            method: "POST",
            body: options,
        });
    }

    // =========================================================================
    // CANDIDATE
    // =========================================================================

    async getAssessmentInfo(link) {
        return this.request(`/api/candidate/assessment/${link}`, {
            auth: false,
        });
    }

    async registerCandidate(link, data) {
        return this.request(`/api/candidate/register/${link}`, {
            method: "POST",
            body: data,
            auth: false,
        });
    }

    async verifyCandidateEmail(candidateAssessmentId, otp) {
        return this.request(`/api/candidate/verify-email/${candidateAssessmentId}`, {
            method: "POST",
            body: { otp },
            auth: false,
        });
    }

    async capturePhoto(candidateAssessmentId, photoData) {
        return this.request(`/api/candidate/capture-photo/${candidateAssessmentId}`, {
            method: "POST",
            body: { photoData },
            auth: false,
        });
    }

    async acceptConsent(candidateAssessmentId) {
        return this.request(`/api/candidate/accept-consent/${candidateAssessmentId}`, {
            method: "POST",
            auth: false,
        });
    }

    async uploadResume(candidateAssessmentId, file, resumeText = "") {
        const formData = new FormData();
        formData.append("resume", file);
        if (resumeText) formData.append("resumeText", resumeText);

        return this.request(`/api/candidate/upload-resume/${candidateAssessmentId}`, {
            method: "POST",
            body: formData,
            isFormData: true,
            auth: false,
        });
    }

    async getResumeStatus(candidateAssessmentId) {
        return this.request(`/api/candidate/resume-status/${candidateAssessmentId}`, {
            auth: false,
        });
    }

    async getCandidateStatus(candidateAssessmentId) {
        return this.request(`/api/candidate/status/${candidateAssessmentId}`, {
            auth: false,
        });
    }

    async startAssessment(candidateAssessmentId) {
        return this.request(`/api/candidate/start/${candidateAssessmentId}`, {
            method: "POST",
            auth: false,
        });
    }

    // =========================================================================
    // ASSESSMENT EXECUTION
    // =========================================================================

    async getSession() {
        return this.request("/api/assessment/session", {
            auth: false,
            useSession: true,
        });
    }

    async getQuestions(section) {
        return this.request(`/api/assessment/questions/${section}`, {
            auth: false,
            useSession: true,
        });
    }

    async saveAnswer(answerData) {
        return this.request("/api/assessment/save-answer", {
            method: "POST",
            body: answerData,
            auth: false,
            useSession: true,
        });
    }

    async submitSection(section) {
        return this.request(`/api/assessment/submit-section/${section}`, {
            method: "POST",
            auth: false,
            useSession: true,
        });
    }

    async submitAssessment() {
        return this.request("/api/assessment/submit-all", {
            method: "POST",
            auth: false,
            useSession: true,
        });
    }

    async logProctoringEvent(eventData) {
        return this.request("/api/assessment/proctoring/event", {
            method: "POST",
            body: eventData,
            auth: false,
            useSession: true,
            silent: true, // Don't throw errors for proctoring - not critical
        });
    }

    async sendHeartbeat() {
        return this.request("/api/assessment/heartbeat", {
            method: "POST",
            auth: false,
            useSession: true,
        });
    }

    // =========================================================================
    // CODE EXECUTION
    // =========================================================================

    async getLanguages() {
        return this.request("/api/code/languages", {
            auth: false,
        });
    }

    async runCode(data) {
        return this.request("/api/code/run", {
            method: "POST",
            body: data,
            auth: false,
            useSession: true,
        });
    }

    async submitCode(data) {
        return this.request("/api/code/submit", {
            method: "POST",
            body: data,
            auth: false,
            useSession: true,
        });
    }

    // =========================================================================
    // ADMIN
    // =========================================================================

    async getJDs(page = 1, limit = 10, format = 'json') {
        const query = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            format
        });

        if (format === 'csv') {
            // For CSV, we need to handle the download differently or return the blob URL
            // But since api.request handles JSON parsing, we might want a raw fetch here for CSV
            // However, to keep it simple with authentication, let's use the token and fetch directly
            const token = this.getToken();
            const response = await fetch(`${this.baseUrl}/api/admin/jds?${query}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            return blob;
        }

        return this.request(`/api/admin/jds?${query}`);
    }

    async getCandidates(jdId) {
        return this.request(`/api/admin/candidates/${jdId}`);
    }

    async getCandidateDetail(candidateAssessmentId) {
        return this.request(`/api/admin/candidate/${candidateAssessmentId}`);
    }

    async getAnalytics(jdId) {
        return this.request(`/api/admin/analytics/${jdId}`);
    }

    async getProctoringEvents(candidateAssessmentId) {
        return this.request(`/api/admin/proctoring/${candidateAssessmentId}`);
    }

    async recordProctoringVerdict(eventId, verdict, notes) {
        return this.request(`/api/admin/proctoring/verdict/${eventId}`, {
            method: "POST",
            body: { verdict, notes },
        });
    }

    async exportCSV(jdId) {
        return this.request(`/api/admin/export/${jdId}/csv`);
    }

    async sendReportEmail(candidateAssessmentId) {
        return this.request(`/api/admin/candidate/${candidateAssessmentId}/email-report`, {
            method: 'POST'
        });
    }

    // =========================================================================
    // EVALUATION
    // =========================================================================

    async getEvaluationResult(candidateAssessmentId) {
        return this.request(`/api/eval/result/${candidateAssessmentId}`);
    }

    async setAdminDecision(candidateAssessmentId, decision, notes) {
        return this.request(`/api/eval/admin-decision/${candidateAssessmentId}`, {
            method: "POST",
            body: { decision, notes },
        });
    }

    // =========================================================================
    // EMAIL
    // =========================================================================

    async getEmailTemplates() {
        return this.request("/api/email/templates");
    }

    async sendResultEmail(candidateAssessmentId, data) {
        return this.request(`/api/email/send-result/${candidateAssessmentId}`, {
            method: "POST",
            body: data,
        });
    }

    // =========================================================================
    // CANDIDATE PROFILE
    // =========================================================================

    async getCandidateProfile() {
        return this.request("/api/candidate/profile");
    }

    async updateCandidateProfile(data) {
        return this.request("/api/candidate/profile", {
            method: "PUT",
            body: data,
        });
    }

    async getCandidateAssessmentHistory() {
        return this.request("/api/candidate/history");
    }

    async getCandidateAssessmentDetail(assessmentId) {
        return this.request(`/api/candidate/history/${assessmentId}`);
    }
}

// Export singleton instance
export const api = new ApiClient();
export default api;
