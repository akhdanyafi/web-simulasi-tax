interface IslamicPatternProps {
  className?: string;
  opacity?: number;
  color?: string;
}

export default function IslamicPattern({ className = '', opacity = 0.06, color = '#10b981' }: IslamicPatternProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity }}
      >
        <defs>
          <pattern id="islamic-star-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            {/* 8-pointed star center */}
            <polygon
              points="60,20 67,45 90,45 72,60 78,85 60,72 42,85 48,60 30,45 53,45"
              fill="none"
              stroke={color}
              strokeWidth="1"
            />
            {/* Inner octagon */}
            <polygon
              points="60,32 69,42 79,42 85,51 85,60 79,69 69,69 60,79 51,69 41,69 35,60 35,51 41,42 51,42"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
            />
            {/* Corner quarter stars */}
            <polygon
              points="0,0 8,12 20,8 12,20 24,24 12,28 20,40 8,36 0,48"
              fill="none"
              stroke={color}
              strokeWidth="0.8"
            />
            <polygon
              points="120,0 112,12 100,8 108,20 96,24 108,28 100,40 112,36 120,48"
              fill="none"
              stroke={color}
              strokeWidth="0.8"
            />
            <polygon
              points="0,120 8,108 20,112 12,100 24,96 12,92 20,80 8,84 0,72"
              fill="none"
              stroke={color}
              strokeWidth="0.8"
            />
            <polygon
              points="120,120 112,108 100,112 108,100 96,96 108,92 100,80 112,84 120,72"
              fill="none"
              stroke={color}
              strokeWidth="0.8"
            />
            {/* Connector lines */}
            <line x1="60" y1="20" x2="60" y2="0" stroke={color} strokeWidth="0.5" />
            <line x1="60" y1="79" x2="60" y2="120" stroke={color} strokeWidth="0.5" />
            <line x1="20" y1="60" x2="0" y2="60" stroke={color} strokeWidth="0.5" />
            <line x1="79" y1="51" x2="120" y2="60" stroke={color} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-star-pattern)" />
      </svg>
    </div>
  );
}

// Decorative Hero Art - Large standalone Islamic geometric
export function IslamicGeometricArt({ size = 400, className = '' }: { size?: number; className?: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="rg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#059669" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer glow circle */}
      <circle cx={cx} cy={cy} r={r + 20} fill="url(#rg1)" />

      {/* Multiple concentric rings */}
      {[1, 0.85, 0.7, 0.55, 0.4].map((scale, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r * scale}
          fill="none"
          stroke="#10b981"
          strokeWidth={i === 0 ? 1.5 : 0.8}
          strokeOpacity={0.3 + i * 0.1}
          strokeDasharray={i % 2 === 0 ? "none" : "4 4"}
        />
      ))}

      {/* 12-pointed star (outer) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const nextAngle = ((i * 30 + 15) * Math.PI) / 180;
        const x1 = cx + r * 0.42 * Math.cos(angle - Math.PI / 2);
        const y1 = cy + r * 0.42 * Math.sin(angle - Math.PI / 2);
        const x2 = cx + r * Math.cos(nextAngle - Math.PI / 2);
        const y2 = cy + r * Math.sin(nextAngle - Math.PI / 2);
        const x3 = cx + r * 0.42 * Math.cos(nextAngle + 15 * Math.PI / 180 - Math.PI / 2);
        const y3 = cy + r * 0.42 * Math.sin(nextAngle + 15 * Math.PI / 180 - Math.PI / 2);
        return (
          <polygon
            key={i}
            points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
            fill={i % 3 === 0 ? '#fbbf24' : '#10b981'}
            fillOpacity={i % 3 === 0 ? 0.25 : 0.15}
            stroke={i % 3 === 0 ? '#fbbf24' : '#34d399'}
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />
        );
      })}

      {/* 8-pointed inner star */}
      {Array.from({ length: 8 }).map((_, i) => {
        const outerAngle = (i * 45 * Math.PI) / 180 - Math.PI / 2;
        const innerAngle = outerAngle + (22.5 * Math.PI) / 180;
        const outerR = r * 0.6;
        const innerR = r * 0.35;
        return null; // simplified
      })}

      {/* 8-pointed star (middle) */}
      <polygon
        points={Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 22.5 - 90) * Math.PI / 180;
          const rad = i % 2 === 0 ? r * 0.6 : r * 0.3;
          return `${cx + rad * Math.cos(angle)},${cy + rad * Math.sin(angle)}`;
        }).join(' ')}
        fill="none"
        stroke="#34d399"
        strokeWidth="1.2"
        strokeOpacity="0.7"
      />

      {/* Inner 6-pointed star */}
      <polygon
        points={Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 - 90) * Math.PI / 180;
          const rad = i % 2 === 0 ? r * 0.38 : r * 0.2;
          return `${cx + rad * Math.cos(angle)},${cy + rad * Math.sin(angle)}`;
        }).join(' ')}
        fill="#fbbf24"
        fillOpacity="0.12"
        stroke="#fbbf24"
        strokeWidth="1"
        strokeOpacity="0.6"
      />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={8} fill="url(#rg2)" />
      <circle cx={cx} cy={cy} r={4} fill="#fbbf24" fillOpacity="0.8" />
      <circle cx={cx} cy={cy} r={2} fill="#fff" fillOpacity="0.9" />

      {/* Radial spokes */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 - 90) * Math.PI / 180;
        return (
          <line
            key={i}
            x1={cx + 10 * Math.cos(angle)}
            y1={cy + 10 * Math.sin(angle)}
            x2={cx + r * 0.28 * Math.cos(angle)}
            y2={cy + r * 0.28 * Math.sin(angle)}
            stroke="#34d399"
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />
        );
      })}

      {/* Corner ornaments */}
      {[
        [0, 0], [size, 0], [0, size], [size, size]
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y}) rotate(${i * 90})`}>
          <path
            d="M0,0 L30,0 L0,30 Z"
            fill="#10b981"
            fillOpacity="0.15"
            stroke="#10b981"
            strokeWidth="0.5"
            strokeOpacity="0.4"
          />
          <circle cx={12} cy={12} r={4} fill="none" stroke="#fbbf24" strokeWidth="0.8" strokeOpacity="0.5" />
        </g>
      ))}
    </svg>
  );
}
