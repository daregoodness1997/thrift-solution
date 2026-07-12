"use client";

import React, { useEffect, useRef, useState, ReactNode } from "react";

interface AnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}

/* ─── FadeIn ─── */
export function FadeIn({ children, className = "", delay = 0, duration = 600, style }: AnimationProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── FadeInUp ─── */
export function FadeInUp({ children, className = "", delay = 0, duration = 600, style }: AnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── FadeInLeft ─── */
export function FadeInLeft({ children, className = "", delay = 0, duration = 600, style }: AnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-24px)",
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── FadeInRight ─── */
export function FadeInRight({ children, className = "", delay = 0, duration = 600, style }: AnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(24px)",
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── ScaleIn ─── */
export function ScaleIn({ children, className = "", delay = 0, duration = 500, style }: AnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.92)",
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── StaggerChildren ─── */
export function StaggerChildren({ children, className = "", staggerDelay = 80, style }: Omit<AnimationProps, "delay"> & { staggerDelay?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const items = React.Children.toArray(children);
  return (
    <div className={className} style={style}>
      {items.map((child, i) => (
        <div
          key={i}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: `opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)`,
            transitionDelay: visible ? `${i * staggerDelay}ms` : "0ms",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/* ─── SlideReveal ─── */
export function SlideReveal({ children, className = "", direction = "left", delay = 0, duration = 700, style }: AnimationProps & { direction?: "left" | "right" | "up" | "down" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const transforms: Record<string, string> = {
    left: visible ? "translateX(0)" : "translateX(-100%)",
    right: visible ? "translateX(0)" : "translateX(100%)",
    up: visible ? "translateY(0)" : "translateY(100%)",
    down: visible ? "translateY(0)" : "translateY(-100%)",
  };

  return (
    <div
      className={className}
      style={{
        transform: transforms[direction],
        transition: `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Typewriter ─── */
export function Typewriter({ text, className = "", speed = 40, delay = 0, style }: { text: string; speed?: number } & Omit<AnimationProps, "children">) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    const startTimer = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(startTimer);
  }, [text, speed, delay]);

  return (
    <span className={className} style={{ fontFamily: "'JetBrains Mono', monospace", ...style }}>
      {displayed}
      {displayed.length < text.length && (
        <span style={{ borderRight: "2px solid currentColor", animation: "pulse-soft 1s infinite", marginLeft: 2 }}>&nbsp;</span>
      )}
    </span>
  );
}

/* ─── CountUp ─── */
export function CountUp({ target, duration = 1500, prefix = "", suffix = "", className = "", style }: { target: number; duration?: number; prefix?: string; suffix?: string } & Pick<AnimationProps, "className" | "style">) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return (
    <span className={className} style={{ fontFamily: "'JetBrains Mono', monospace", ...style }}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

/* ─── PulseDot ─── */
export function PulseDot({ color = "#4A5D4E", size = 8 }: { color?: string; size?: number }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <span style={{ position: "absolute", width: size, height: size, borderRadius: "50%", backgroundColor: color, animation: "pulse-soft 2s ease-in-out infinite" }} />
      <span style={{ position: "relative", width: size * 0.5, height: size * 0.5, borderRadius: "50%", backgroundColor: color }} />
    </span>
  );
}

/* ─── FloatingElement ─── */
export function FloatingElement({ children, className = "", speed = 3, amplitude = 8, delay = 0, style }: Omit<AnimationProps, "duration"> & { speed?: number; amplitude?: number }) {
  return (
    <div
      className={className}
      style={{
        animation: `float ${speed}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Shimmer ─── */
export function Shimmer({ children, className = "", style }: Pick<AnimationProps, "children" | "className" | "style">) {
  return (
    <div
      className={className}
      style={{
        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s infinite",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
