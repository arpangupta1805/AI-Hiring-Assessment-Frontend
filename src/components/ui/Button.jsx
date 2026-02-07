/**
 * Button Component
 * Luxury minimalist button with primary, secondary, and ghost variants
 */

export function Button({
    children,
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    className = "",
    ...props
}) {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-normal tracking-wide rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)]",
        secondary: "bg-transparent text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-hover)]",
        ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5 text-sm",
        lg: "px-7 py-3 text-base",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                </>
            ) : (
                children
            )}
        </button>
    );
}
