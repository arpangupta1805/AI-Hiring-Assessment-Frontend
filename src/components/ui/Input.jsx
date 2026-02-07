/**
 * Input Component
 * Minimalist text input with label support
 */

export function Input({
    label,
    error,
    type = "text",
    className = "",
    ...props
}) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                    {label}
                </label>
            )}
            <input
                type={type}
                className={`
          w-full px-4 py-3 text-sm
          bg-[var(--bg-elevated)] text-[var(--text-primary)]
          border border-[var(--border-default)] rounded-lg
          transition-all duration-150
          hover:border-[var(--border-hover)]
          focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 focus:outline-none
          placeholder:text-[var(--text-muted)]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-[var(--status-error-text)]" : ""}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-xs text-[var(--status-error-text)]">{error}</p>
            )}
        </div>
    );
}

/**
 * Textarea Component
 */
export function Textarea({
    label,
    error,
    rows = 4,
    className = "",
    ...props
}) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                    {label}
                </label>
            )}
            <textarea
                rows={rows}
                className={`
          w-full px-4 py-3 text-sm
          bg-[var(--bg-elevated)] text-[var(--text-primary)]
          border border-[var(--border-default)] rounded-lg
          transition-all duration-150
          hover:border-[var(--border-hover)]
          focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 focus:outline-none
          placeholder:text-[var(--text-muted)]
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none
          ${error ? "border-[var(--status-error-text)]" : ""}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-xs text-[var(--status-error-text)]">{error}</p>
            )}
        </div>
    );
}
