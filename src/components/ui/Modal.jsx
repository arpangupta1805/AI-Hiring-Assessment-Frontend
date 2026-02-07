"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Modal Component
 * Clean overlay dialog with close functionality
 */
export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = "md",
    showClose = true,
}) {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[90vw]",
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                className={`
          relative z-10 w-full ${sizes[size]} mx-4
          bg-[var(--bg-elevated)]
          border border-[var(--border-default)]
          rounded-xl shadow-[var(--shadow-lg)]
          animate-slideUp
        `}
            >
                {/* Header */}
                {(title || showClose) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
                        {title && (
                            <h2 className="text-lg font-light text-[var(--text-primary)]">
                                {title}
                            </h2>
                        )}
                        {showClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    );
}

/**
 * ModalFooter Component
 */
export function ModalFooter({ children, className = "" }) {
    return (
        <div className={`flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[var(--border-default)] ${className}`}>
            {children}
        </div>
    );
}
