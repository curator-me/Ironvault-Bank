import { useEffect } from 'react';
import { animate, useMotionValue, useTransform, motion } from 'framer-motion';
import { formatCurrency } from '../utils/formatters';

// Animated count-up that tweens from 0 to `value` on mount/update using Framer Motion.
export const CountUp = ({ value = 0, duration = 1.2, format = formatCurrency }) => {
  const count = useMotionValue(0);
  const display = useTransform(count, (latest) => format(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration, ease: 'easeOut' });
    return controls.stop;
  }, [value, duration, count]);

  return <motion.span>{display}</motion.span>;
};
