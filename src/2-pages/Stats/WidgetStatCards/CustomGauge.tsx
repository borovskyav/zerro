import React, { createContext, useContext, ReactNode } from 'react'
import { Box } from '@mui/material'

export const SafetyRanges = [
  { min: -Infinity, max: 1, color: '#F44336', tooltip: 'safetyMonths.veryLow' },
  { min: 1, max: 3, color: '#FF9800', tooltip: 'safetyMonths.low' },
  { min: 3, max: 6, color: '#FFC107', tooltip: 'safetyMonths.normal' },
  { min: 6, max: 12, color: '#4CAF50', tooltip: 'safetyMonths.good' },
  { min: 12, max: Infinity, color: '#4CAF50', tooltip: 'safetyMonths.excess' },
]

type GaugeContextType = {
  value: number
  valueMax: number
  valueMin: number
  startAngle: number
  endAngle: number
  innerRadius: number
  outerRadius: number
  color: string
  text: string
}

const GaugeContext = createContext<GaugeContextType | undefined>(undefined);

const useGaugeContext = () => {
  const context = useContext(GaugeContext);
  if (!context) {
    throw new Error('Gauge components must be used within a GaugeContainer');
  }
  return context;
};

type GaugeContainerProps = {
  children: ReactNode
  value: number
  valueMax: number
  valueMin?: number
  startAngle?: number
  endAngle?: number
  innerRadius?: number
  outerRadius?: number
  color: string
  text?: string
}

export const GaugeContainer: React.FC<GaugeContainerProps> = (props) => {
  const {children, value, valueMax, valueMin = 0, startAngle = -105, endAngle = 105, innerRadius = 65, outerRadius = 90, color, text = ''} = props
  const contextValue = {value, valueMax, valueMin, startAngle, endAngle, innerRadius, outerRadius, color, text};

  return (
    <GaugeContext.Provider value={contextValue}>
      <Box position="relative" width={200} height={200} sx={{ zIndex: 0 }}>
        {children}
      </Box>
    </GaugeContext.Provider>
  );
};

type GaugeReferenceArcProps = {
  startAngle?: number
  endAngle?: number
  innerRadius?: number
  outerRadius?: number
  color?: string
}

// Component for displaying the background arc element
export const GaugeReferenceArc: React.FC<GaugeReferenceArcProps> = ({
  startAngle: propStartAngle,
  endAngle: propEndAngle,
  innerRadius: propInnerRadius,
  outerRadius: propOuterRadius,
  color,
}) => {
  const { startAngle, endAngle, innerRadius, outerRadius } = useGaugeContext();
  const finalStartAngle = propStartAngle === undefined ? startAngle : propStartAngle;
  const finalEndAngle = propEndAngle === undefined ? endAngle : propEndAngle;
  const finalInnerRadius = propInnerRadius === undefined ? innerRadius : propInnerRadius;
  const finalOuterRadius = propOuterRadius === undefined ? outerRadius : propOuterRadius;

  // Create path for the arc
  const arcPath = React.useMemo(() => createArcPath(
    finalStartAngle,
    finalEndAngle,
    finalInnerRadius,
    finalOuterRadius
  ), [finalStartAngle, finalEndAngle, finalInnerRadius, finalOuterRadius]);

  return (
    <Box position="absolute" top={0} left={0} width="100%" height="100%">
      <svg width="100%" height="100%" viewBox="0 0 180 150">
        <path
          d={arcPath}
          fill={color}
        />
      </svg>
    </Box>
  );
};

// Component for displaying the value on the gauge
export const GaugeValueArc: React.FC<{innerRadius?: number, outerRadius?: number}> = ({innerRadius: propInnerRadius, outerRadius: propOuterRadius}) => {
  const { value, valueMin, valueMax, startAngle, endAngle, innerRadius, outerRadius, color, text } = useGaugeContext();
  const finalInnerRadius = propInnerRadius === undefined ? innerRadius : propInnerRadius;
  const finalOuterRadius = propOuterRadius === undefined ? outerRadius : propOuterRadius;

  // Calculate fill percentage (clamped between 0 and 1)
  const percent = Math.max(0, Math.min(1, (value - valueMin) / (valueMax - valueMin)));

  // Calculate angle for current value
  const fullAngleRange = endAngle - startAngle;
  const valueEndAngle = startAngle + (percent * fullAngleRange);

  // Create path for the value arc
  const arcPath = React.useMemo(() => createArcPath(
    startAngle,
    valueEndAngle,
    finalInnerRadius,
    finalOuterRadius
  ), [startAngle, valueEndAngle, finalInnerRadius, finalOuterRadius]);

  return (
    <Box position="absolute" top={0} left={0} width="100%" height="100%" sx={{ zIndex: 2 }}>
      <svg width="100%" height="100%" viewBox="0 0 180 150">
        <path
          d={arcPath}
          fill={color}
        />
        {text && (
          <text
            x="90"
            y="75"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{fontSize: '1rem', fontWeight: 'bold', fill: 'var(--mui-palette-text-secondary)'}}
          >
            {text}
          </text>
        )}
      </svg>
    </Box>
  );
};

export const ColoredGaugeReferenceArc: React.FC<{innerRadius?: number, outerRadius?: number}> = ({innerRadius: propInnerRadius, outerRadius: propOuterRadius}) => {
  const { startAngle, endAngle, innerRadius, outerRadius, valueMax } = useGaugeContext();
  const finalInnerRadius = propInnerRadius || innerRadius;
  const finalOuterRadius = propOuterRadius || outerRadius;

  // Maximum value for safety ranges (default to valueMax if available, otherwise 12)
  const maxRangeValue = valueMax || 12;

  // Create array of segments for display
  const segments = React.useMemo(() => SafetyRanges.map((range, index) => {
    const segmentMin = Math.max(range.min, 0);
    const segmentMax = Math.min(range.max, maxRangeValue);

    // Skip segments that don't fit in the gauge range
    if (segmentMin >= segmentMax) return null;

    // Calculate percentages for segment start and end
    const startPercent = segmentMin / maxRangeValue;
    const endPercent = segmentMax / maxRangeValue;

    // Calculate angles for the segment
    const fullAngleRange = endAngle - startAngle;
    const segmentStartAngle = startAngle + (startPercent * fullAngleRange);
    const segmentEndAngle = startAngle + (endPercent * fullAngleRange);

    return {
      startAngle: segmentStartAngle,
      endAngle: segmentEndAngle,
      color: range.color,
      key: `segment-${index}`
    };
  }).filter(x => x !== null), [startAngle, endAngle, maxRangeValue]);

  return (
    <Box position="absolute" top={0} left={0} width="100%" height="100%">
      <svg width="100%" height="100%" viewBox="0 0 180 150">
        {segments.map((segment) => (
          <path
            key={segment.key}
            d={createArcPath(segment.startAngle, segment.endAngle, finalInnerRadius, finalOuterRadius)}
            fill={segment.color}
          />
        ))}
      </svg>
    </Box>
  );
}

const createArcPath = (
  startAngle: number,
  endAngle: number,
  innerRadius: number,
  outerRadius: number,
  cx: number = 90, // center X (half of 180px width)
  cy: number = 75  // center Y (half of 150px height)
): string => {
  // Rotate 90 degrees counterclockwise
  const rotatedStartAngle = startAngle - 90;
  const rotatedEndAngle = endAngle - 90;

  // Convert angles from degrees to radians
  const startRad = (rotatedStartAngle * Math.PI) / 180;
  const endRad = (rotatedEndAngle * Math.PI) / 180;

  // Calculate coordinates for outer arc
  const x1 = cx + outerRadius * Math.cos(startRad);
  const y1 = cy + outerRadius * Math.sin(startRad);
  const x2 = cx + outerRadius * Math.cos(endRad);
  const y2 = cy + outerRadius * Math.sin(endRad);

  // Calculate coordinates for inner arc
  const x3 = cx + innerRadius * Math.cos(endRad);
  const y3 = cy + innerRadius * Math.sin(endRad);
  const x4 = cx + innerRadius * Math.cos(startRad);
  const y4 = cy + innerRadius * Math.sin(startRad);

  // Large arc flag (1 if angle > 180 degrees)
  const largeArcFlag = rotatedEndAngle - rotatedStartAngle > 180 ? 1 : 0;

  // Create SVG path
  return `
    M ${x1},${y1}
    A ${outerRadius},${outerRadius} 0 ${largeArcFlag} 1 ${x2},${y2}
    L ${x3},${y3}
    A ${innerRadius},${innerRadius} 0 ${largeArcFlag} 0 ${x4},${y4}
    Z
  `;
};
