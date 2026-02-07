/**
 * Footer Component
 * Minimal footer with copyright
 */
export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="py-8 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-[var(--text-muted)]">
                        © {currentYear} AI Hiring Platform. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a
                            href="#"
                            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                            Privacy Policy
                        </a>
                        <a
                            href="#"
                            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
