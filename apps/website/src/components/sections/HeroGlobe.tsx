import React, { useEffect, useRef, useState } from 'react';

interface HeroGlobeProps {
  isDark?: boolean;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  lat: number;
  lng: number;
  size: number;
  pulseOffset: number;
  label?: string;
  isHub?: boolean;
}

interface Arc3D {
  start: Point3D;
  end: Point3D;
  progress: number;
  speed: number;
  color: string;
}

export const HeroGlobe: React.FC<HeroGlobeProps> = ({ isDark = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredHub, setHoveredHub] = useState<string | null>(null);
  
  const rotationRef = useRef({ x: 0.3, y: 0.005 });
  const mouseRef = useRef({ isDown: false, x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const radius = Math.min(width, height) * 0.38;

    // Generate Globe Points (Coastline density & Global Hubs)
    const points: Point3D[] = [];
    const numPoints = 650;

    // Golden spiral sphere distribution
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2; // -1 to 1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const lat = Math.asin(y) * (180 / Math.PI);
      const lng = Math.atan2(z, x) * (180 / Math.PI);

      points.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        lat,
        lng,
        size: Math.random() * 1.5 + 1,
        pulseOffset: Math.random() * Math.PI * 2,
        isHub: false
      });
    }

    // Add key real-world hub locations with labels
    const hubsData = [
      { lat: -1.286389, lng: 36.817223, label: 'Nairobi, Kenya' },
      { lat: 6.524379, lng: 3.379206, label: 'Lagos, Nigeria' },
      { lat: 6.244203, lng: -75.581212, label: 'Medellin, Colombia' },
      { lat: 12.971598, lng: 77.594566, label: 'Bengaluru, India' },
      { lat: 31.952162, lng: 35.233154, label: 'Amman, Jordan' },
      { lat: 37.774929, lng: -122.419416, label: 'San Francisco, USA' },
      { lat: 51.507351, lng: -0.127758, label: 'London, UK' },
      { lat: -33.92487, lng: 18.424055, label: 'Cape Town, South Africa' },
      { lat: -12.046374, lng: -77.042793, label: 'Lima, Peru' },
      { lat: 23.810331, lng: 90.412518, label: 'Dhaka, Bangladesh' }
    ];

    const hubs: Point3D[] = hubsData.map((h) => {
      const phiRad = (90 - h.lat) * (Math.PI / 180);
      const thetaRad = (h.lng + 180) * (Math.PI / 180);

      const x = -(radius * Math.sin(phiRad) * Math.cos(thetaRad));
      const z = radius * Math.sin(phiRad) * Math.sin(thetaRad);
      const y = radius * Math.cos(phiRad);

      return {
        x,
        y,
        z,
        lat: h.lat,
        lng: h.lng,
        size: 3.5,
        pulseOffset: Math.random() * Math.PI * 2,
        label: h.label,
        isHub: true
      };
    });

    const allPoints = [...points, ...hubs];

    // Arcs connecting Hubs
    const arcs: Arc3D[] = [];
    for (let i = 0; i < hubs.length; i++) {
      const nextIdx = (i + 2) % hubs.length;
      arcs.push({
        start: hubs[i],
        end: hubs[nextIdx],
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.003,
        color: i % 2 === 0 ? '#1F6FEB' : '#22C55E'
      });
    }

    let angleY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Auto-rotation unless user is dragging
      if (!mouseRef.current.isDown) {
        angleY += rotationRef.current.y;
      }

      const cx = width / 2;
      const cy = height / 2;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(rotationRef.current.x);
      const sinX = Math.sin(rotationRef.current.x);

      // Transform & sort points by Z depth
      const projectedPoints = allPoints.map((p) => {
        // Rotate around Y axis
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;

        // Rotate around X axis
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        // Perspective factor
        const scale = 1000 / (1000 - z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        return { ...p, px, py, pz: z2, scale };
      });

      projectedPoints.sort((a, b) => a.pz - b.pz);

      // Draw subtle atmosphere halo behind globe
      const haloGradient = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.25);
      if (isDark) {
        haloGradient.addColorStop(0, 'rgba(31, 111, 235, 0.12)');
        haloGradient.addColorStop(0.6, 'rgba(79, 70, 229, 0.05)');
        haloGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        haloGradient.addColorStop(0, 'rgba(31, 111, 235, 0.08)');
        haloGradient.addColorStop(0.6, 'rgba(34, 197, 94, 0.03)');
        haloGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = haloGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Render points
      projectedPoints.forEach((p) => {
        // Depth opacity
        const alpha = Math.max(0.08, (p.pz + radius) / (2 * radius));
        if (alpha <= 0.05) return;

        ctx.save();
        if (p.isHub) {
          // Pulsing Hub
          const pulse = Math.sin(Date.now() * 0.003 + p.pulseOffset) * 0.5 + 0.5;
          ctx.fillStyle = isDark ? '#22C55E' : '#1F6FEB';
          ctx.beginPath();
          ctx.arc(p.px, p.py, (p.size + pulse * 2.5) * p.scale, 0, Math.PI * 2);
          ctx.fill();

          // Hub ring animation
          ctx.strokeStyle = isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(31, 111, 235, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.px, p.py, (p.size * 2 + pulse * 4) * p.scale, 0, Math.PI * 2);
          ctx.stroke();

          // Label if facing front
          if (p.pz > 0) {
            ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
            ctx.font = '500 11px Inter, sans-serif';
            ctx.fillText(p.label || '', p.px + 10, p.py + 4);
          }
        } else {
          // Normal particle
          const pointColor = isDark
            ? `rgba(148, 163, 184, ${alpha * 0.6})`
            : `rgba(71, 85, 105, ${alpha * 0.5})`;
          ctx.fillStyle = pointColor;
          ctx.beginPath();
          ctx.arc(p.px, p.py, p.size * p.scale, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Render Arcs
      arcs.forEach((arc) => {
        arc.progress = (arc.progress + arc.speed) % 1;

        const startP = projectedPoints.find((p) => p.isHub && p.label === arc.start.label);
        const endP = projectedPoints.find((p) => p.isHub && p.label === arc.end.label);

        if (startP && endP && startP.pz > -radius * 0.4 && endP.pz > -radius * 0.4) {
          ctx.save();
          const midX = (startP.px + endP.px) / 2;
          const midY = (startP.px + endP.py) / 2 - 40; // curve elevation

          ctx.beginPath();
          ctx.moveTo(startP.px, startP.py);
          ctx.quadraticCurveTo(midX, midY, endP.px, endP.py);

          ctx.strokeStyle = isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(31, 111, 235, 0.2)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Moving packet along arc
          const t = arc.progress;
          const currX = (1 - t) * (1 - t) * startP.px + 2 * (1 - t) * t * midX + t * t * endP.px;
          const currY = (1 - t) * (1 - t) * startP.py + 2 * (1 - t) * t * midY + t * t * endP.py;

          ctx.fillStyle = arc.color;
          ctx.beginPath();
          ctx.arc(currX, currY, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Mouse Controls for rotation
    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return;
      const dx = e.clientX - mouseRef.current.x;
      const dy = e.clientY - mouseRef.current.y;

      angleY += dx * 0.005;
      rotationRef.current.x = Math.max(-0.8, Math.min(0.8, rotationRef.current.x + dy * 0.005));

      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <div className="relative w-full h-full min-h-[420px] md:min-h-[550px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none text-xs font-medium text-slate-400 dark:text-slate-500 bg-white/60 dark:bg-slate-900/60 px-3 py-1 rounded-full backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50">
        Interactive 3D Network • Click & Drag to Rotate
      </div>
    </div>
  );
};
