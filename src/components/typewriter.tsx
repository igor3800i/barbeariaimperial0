import { useEffect, useState } from "react";

export function Typewriter({
  text,
  durationMs = 2500,
  className,
}: {
  text: string;
  durationMs?: number;
  className?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    const step = Math.max(20, Math.floor(durationMs / Math.max(text.length, 1)));
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, step);
    return () => clearInterval(id);
  }, [text, durationMs]);

  const done = count >= text.length;
  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{text.slice(0, count)}</span>
      <span
        aria-hidden
        className="ml-1 inline-block w-[0.08em] translate-y-[0.05em] self-stretch bg-primary align-middle"
        style={{
          height: "0.9em",
          animation: done ? "tw-blink 1s steps(1) infinite" : "none",
        }}
      />
    </span>
  );
}
