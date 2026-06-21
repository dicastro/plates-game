import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  variant?: ButtonVariant;
  children: ReactNode;
  onClick?: () => void;
  throttleMs?: number;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[#111111] hover:bg-[var(--color-accent-hover)] px-6 py-[11px]",
  secondary:
    "bg-[#0e2615] text-[var(--color-accent)] border-2 border-[var(--color-accent)] hover:bg-[#162e1c] px-6 py-[9px]",
  danger: "bg-[var(--color-danger)] text-white hover:bg-[#e74c3c] px-6 py-[11px]",
  ghost:
    "bg-transparent text-[var(--color-text-muted)] border-[1.5px] border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] px-5 py-[9px]",
};

export default function Button({
  variant = "primary",
  children,
  onClick,
  throttleMs = 400,
  disabled,
  className = "",
  ...rest
}: ButtonProps) {
  const lastClickRef = useRef(0);

  function handleClick() {
    const now = Date.now();
    if (now - lastClickRef.current < throttleMs) return;
    lastClickRef.current = now;
    onClick?.();
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`rounded-[10px] font-bold text-sm min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}