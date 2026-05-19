import { useMemo } from "react";

const COUNT = 40;

export function HeroParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const size = 2 + Math.random() * 3;
        const left = Math.random() * 100;
        const duration = 12 + Math.random() * 14;
        const delay = -Math.random() * duration;
        const opacity = 0.2 + Math.random() * 0.4;
        const drift = (Math.random() - 0.5) * 40;
        return { i, size, left, duration, delay, opacity, drift };
      }),
    [],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {particles.map((p) => (
        <span
          key={p.i}
          className="hero-particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            // @ts-expect-error CSS custom props
            "--p-opacity": p.opacity,
            "--p-drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
