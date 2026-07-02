interface LoadingOverlayProps {
  message: string;
}

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-[rgba(15,30,18,0.85)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-[7px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[7px] h-[7px] rounded-full bg-[var(--color-accent)] plates-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <p className="text-xs text-[var(--color-text)]">{message}</p>
      </div>
    </div>
  );
}