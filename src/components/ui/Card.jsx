/**
 * Card Component
 * Elevated container with subtle shadow
 */

export function Card({
    children,
    className = "",
    hover = false,
    padding = "md",
    ...props
}) {
    const paddings = {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
    };

    return (
        <div
            className={`
        bg-[var(--bg-elevated)]
        border border-[var(--border-default)]
        rounded-xl
        shadow-[var(--shadow-sm)]
        ${hover ? "transition-all duration-250 hover:shadow-[var(--shadow-md)] hover:border-[var(--border-hover)]" : ""}
        ${paddings[padding]}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * CardHeader Component
 */
export function CardHeader({ children, className = "" }) {
    return (
        <div className={`mb-4 ${className}`}>
            {children}
        </div>
    );
}

/**
 * CardTitle Component
 */
export function CardTitle({ children, className = "" }) {
    return (
        <h3 className={`text-lg font-light text-[var(--text-primary)] ${className}`}>
            {children}
        </h3>
    );
}

/**
 * CardDescription Component
 */
export function CardDescription({ children, className = "" }) {
    return (
        <p className={`text-sm text-[var(--text-secondary)] mt-1 ${className}`}>
            {children}
        </p>
    );
}

/**
 * CardContent Component
 */
export function CardContent({ children, className = "" }) {
    return (
        <div className={className}>
            {children}
        </div>
    );
}

/**
 * CardFooter Component
 */
export function CardFooter({ children, className = "" }) {
    return (
        <div className={`mt-6 pt-4 border-t border-[var(--border-default)] ${className}`}>
            {children}
        </div>
    );
}
