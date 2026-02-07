/**
 * Badge Component
 * Status indicators with subtle colors
 */

export function Badge({
    children,
    variant = "info",
    className = "",
}) {
    const variants = {
        success: "bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
        error: "bg-[var(--status-error-bg)] text-[var(--status-error-text)]",
        warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
        info: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
    };

    return (
        <span
            className={`
        inline-flex items-center
        px-2.5 py-0.5
        text-xs font-normal
        rounded
        ${variants[variant]}
        ${className}
      `}
        >
            {children}
        </span>
    );
}
