import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CursorGlow() {
  const [visible, setVisible] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // useSpring gives it a buttery smooth fluid follow effect
  const springConfig = { damping: 30, stiffness: 220, mass: 0.6 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
      if (!visible) setVisible(true);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [visible, cursorX, cursorY]);

  if (!visible) return null;

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: springX,
        top: springY,
        width: 32,
        height: 32,
        borderRadius: '50%',
        backgroundColor: 'rgba(79, 70, 229, 0.12)', // Subtle luxury violet glow
        border: '1px solid rgba(79, 70, 229, 0.25)',
        pointerEvents: 'none',
        zIndex: 99999,
        backdropFilter: 'blur(1px)',
      }}
    />
  );
}
