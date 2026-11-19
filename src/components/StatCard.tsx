export function StatCard({
  title,
  value,
  suffix,
  detail,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  detail: string;
}) {
  return (
    <div className="card stat-card">
      <span className="eyebrow">{title}</span>
      <div className="stat-value">
        {value}
        {suffix ? <small>{suffix}</small> : null}
      </div>
      <p className="muted">{detail}</p>
    </div>
  );
}
