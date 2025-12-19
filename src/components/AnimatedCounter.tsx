import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  delay = 0,
  className,
  formatter = (v) => v.toString(),
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const hasAnimated = useRef(false);
  const startValueRef = useRef(0);

  // Mantém um snapshot do valor atual para permitir animação a partir do último valor exibido
  useEffect(() => {
    startValueRef.current = displayValue;
  }, [displayValue]);

  // Mantém o contador correto em cenários em que o inView falha (ex.: containers com scroll)
  // e também após a primeira animação.
  useEffect(() => {
    if (!isInView || hasAnimated.current) {
      setDisplayValue(value);
    }
  }, [value, isInView]);

  // Animação inicial (apenas uma vez)
  useEffect(() => {
    if (!isInView) return;
    if (hasAnimated.current) return;

    const startValue = startValueRef.current;
    const endValue = value;

    hasAnimated.current = true;

    if (duration <= 0 || startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    const startTime = performance.now() + delay;
    const delta = endValue - startValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.floor(startValue + eased * delta));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration, delay]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: delay / 1000 }}
      className={className}
    >
      {formatter(displayValue)}
    </motion.span>
  );
}
