import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface IndonesiaMapProps {
  className?: string;
}

const PATH_DRAW_DURATION = 0.45;
const PROVINCE_STAGGER = 0.006;
const ISLAND_STAGGER = 0.001;

export default function IndonesiaMap({ className = '' }: IndonesiaMapProps) {
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [viewBox, setViewBox] = useState('95 -11 50 25');
  const [yFlipOffset, setYFlipOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load GeoJSON from public directory
    fetch('/maps/indonesia-prov.geojson')
      .then(res => res.json())
      .then(data => {
        setGeojsonData(data);
        // Calculate viewBox from GeoJSON bounds
        if (data.features && data.features.length > 0) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          
          data.features.forEach((feature: any) => {
            const coords = feature.geometry.coordinates;
            const processCoords = (coordArray: any) => {
              if (typeof coordArray[0] === 'number') {
                minX = Math.min(minX, coordArray[0]);
                maxX = Math.max(maxX, coordArray[0]);
                minY = Math.min(minY, coordArray[1]);
                maxY = Math.max(maxY, coordArray[1]);
              } else {
                coordArray.forEach(processCoords);
              }
            };
            processCoords(coords);
          });

          const width = maxX - minX;
          const height = maxY - minY;
          const padding = Math.max(width, height) * 0.05;
          setYFlipOffset(minY + maxY);
          setViewBox(`${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`);
        }
      })
      .catch(err => console.error('Failed to load GeoJSON:', err));
  }, []);

  const renderPath = (coordinates: any): string => {
    if (!coordinates || coordinates.length === 0) return '';

    const projectPoint = (point: [number, number]): string => {
      return `${point[0]},${yFlipOffset - point[1]}`;
    };

    const renderCoordinates = (coords: any): string => {
      if (typeof coords[0] === 'number') {
        return projectPoint(coords as [number, number]);
      }
      
      if (coords[0] && typeof coords[0][0] === 'number') {
        const [firstPoint, ...restPoints] = coords as [number, number][];
        const lineTo = restPoints.map(projectPoint).join(' L ');
        return `M ${projectPoint(firstPoint)}${lineTo ? ` L ${lineTo}` : ''} Z`;
      }
      
      return coords.map(renderCoordinates).join(' ');
    };

    return renderCoordinates(coordinates);
  };

  if (!geojsonData) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${className}`}
    >
      <svg
        viewBox={viewBox}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
          </linearGradient>
          <filter id="mapShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {geojsonData.features.map((feature: any, idx: number) => {
          const { geometry } = feature;
          
          if (geometry.type === 'Polygon') {
            return (
              <motion.path
                key={idx}
                d={renderPath(geometry.coordinates)}
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                transition={{
                  duration: PATH_DRAW_DURATION,
                  delay: idx * PROVINCE_STAGGER,
                  ease: 'easeOut'
                }}
                fill="url(#mapGradient)"
                fillRule="evenodd"
                stroke="#047857"
                strokeWidth="0.05"
                filter="url(#mapShadow)"
                className="hover:fill-green-600 transition-colors duration-300 cursor-pointer"
              />
            );
          }
          
          if (geometry.type === 'MultiPolygon') {
            return geometry.coordinates.map((polygon: any, polyIdx: number) => (
              <motion.path
                key={`${idx}-${polyIdx}`}
                d={renderPath(polygon)}
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                transition={{
                  duration: PATH_DRAW_DURATION,
                  delay: idx * PROVINCE_STAGGER + polyIdx * ISLAND_STAGGER,
                  ease: 'easeOut'
                }}
                fill="url(#mapGradient)"
                fillRule="evenodd"
                stroke="#047857"
                strokeWidth="0.05"
                filter="url(#mapShadow)"
                className="hover:fill-green-600 transition-colors duration-300 cursor-pointer"
              />
            ));
          }
          
          return null;
        })}
      </svg>

    </motion.div>
  );
}
