export function WeightGraphCard({
  data,
  goalWeight,
  unit,
}: {
  data: { label: string; weight: number }[];
  goalWeight: number | null;
  unit: string;
}) {
  const weights = data
    .map((point) => point.weight)
    .filter((value) => Number.isFinite(value));

  if (weights.length === 0) {
    return (
      <div className="hp-card-lg flex min-h-64 items-center justify-center p-5 text-center">
        <p className="max-w-xs text-sm font-medium text-[var(--brand-muted)]">
          Log your first weight to see a graph here.
        </p>
      </div>
    );
  }

  const values = [...weights];
  if (goalWeight !== null && Number.isFinite(goalWeight)) {
    values.push(goalWeight);
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = maxValue - minValue;
  const padding = Math.max(5, spread * 0.12);
  const domainMin = Math.floor((minValue - padding) * 10) / 10;
  const domainMax = Math.ceil((maxValue + padding) * 10) / 10;
  const domainSpread = domainMax - domainMin || 1;

  const width = 320;
  const height = 240;
  const margin = { top: 20, right: 16, bottom: 36, left: 44 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount }, (_, index) => {
    const ratio = index / (tickCount - 1);
    return domainMax - ratio * domainSpread;
  });

  function getX(index: number) {
    if (data.length === 1) return margin.left + plotWidth / 2;
    return margin.left + (index / (data.length - 1)) * plotWidth;
  }

  function getY(weight: number) {
    return (
      margin.top +
      ((domainMax - weight) / domainSpread) * plotHeight
    );
  }

  const points = data.map((point, index) => ({
    ...point,
    x: getX(index),
    y: getY(point.weight),
  }));
  const linePath = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    })
    .join(" ");
  const goalY =
    goalWeight !== null && Number.isFinite(goalWeight)
      ? getY(goalWeight)
      : null;

  return (
    <section className="hp-card-lg p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-80 w-full overflow-visible"
        role="img"
        aria-label={`Weight graph in ${unit}`}
        preserveAspectRatio="none"
      >
        {ticks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y}
                y2={y}
                stroke="var(--brand-line)"
                strokeDasharray="4 7"
                strokeWidth="1"
              />
              <text
                x={margin.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-[var(--brand-muted)] text-[11px] font-semibold"
              >
                {tick.toFixed(0)}
              </text>
            </g>
          );
        })}

        {goalY !== null ? (
          <g>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={goalY}
              y2={goalY}
              stroke="var(--brand-yellow)"
              strokeDasharray="6 6"
              strokeWidth="1.5"
            />
            <text
              x={margin.left + 6}
              y={Math.max(12, goalY - 8)}
              className="fill-[var(--brand-muted)] text-[10px] font-bold"
            >
              Goal {goalWeight!.toFixed(1)} {unit}
            </text>
          </g>
        ) : null}

        {points.length > 1 ? (
          <path
            d={linePath}
            fill="none"
            stroke="var(--brand-teal)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        {points.map((point) => (
          <g key={`${point.label}-${point.weight}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="var(--brand-card)"
              stroke="var(--brand-teal)"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}

        {points.map((point, index) => {
          if (data.length > 7 && index !== 0 && index !== data.length - 1) {
            return null;
          }

          return (
            <text
              key={`${point.label}-label`}
              x={point.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-[var(--brand-muted)] text-[11px] font-bold"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
    </section>
  );
}
