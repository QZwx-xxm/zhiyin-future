export function ProgressRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="progress-ring">
      <div
        className="progress-ring-inner"
        style={{ background: `conic-gradient(var(--primary) ${value * 3.6}deg, #dbe6f3 0deg)` }}
      >
        <div className="progress-ring-core">
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}
