import { motion } from 'framer-motion';

interface GlassSkeletonLoaderProps {
  type?: 'dashboard' | 'list' | 'card';
}

function SkeletonBar({ width = '100%', height = '1rem', delay = 0 }: { width?: string; height?: string; delay?: number }) {
  return (
    <motion.div
      className="skeleton-glass rounded-lg"
      style={{ width, height }}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.8, repeat: Infinity, delay }}
    />
  );
}

export default function GlassSkeletonLoader({ type = 'dashboard' }: GlassSkeletonLoaderProps) {
  if (type === 'list') {
    return (
      <div className="space-y-3 p-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="glass-card rounded-2xl p-4 flex items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <SkeletonBar width="2.5rem" height="2.5rem" delay={i * 0.15} />
            <div className="flex-1 space-y-2">
              <SkeletonBar width="60%" height="0.75rem" delay={i * 0.15 + 0.1} />
              <SkeletonBar width="40%" height="0.5rem" delay={i * 0.15 + 0.2} />
            </div>
            <SkeletonBar width="4rem" height="0.75rem" delay={i * 0.15 + 0.3} />
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <motion.div
        className="glass-card rounded-2xl p-5 space-y-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <SkeletonBar width="50%" height="1rem" />
        <SkeletonBar width="100%" height="2.5rem" delay={0.1} />
        <div className="flex gap-3">
          <SkeletonBar width="50%" height="1.5rem" delay={0.2} />
          <SkeletonBar width="50%" height="1.5rem" delay={0.3} />
        </div>
      </motion.div>
    );
  }

  // Dashboard skeleton
  return (
    <div className="pb-20 min-h-screen">
      <div className="gradient-hero px-5 pt-6 pb-10 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2 flex-1">
            <SkeletonBar width="40%" height="0.75rem" />
            <SkeletonBar width="60%" height="1rem" delay={0.1} />
          </div>
          <SkeletonBar width="3rem" height="2rem" delay={0.2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="glass rounded-2xl p-4 space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <SkeletonBar width="60%" height="0.5rem" delay={0.3 + i * 0.1} />
              <SkeletonBar width="80%" height="1.5rem" delay={0.4 + i * 0.1} />
            </motion.div>
          ))}
        </div>
      </div>
      <div className="px-5 -mt-5 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="glass-card rounded-xl p-3 space-y-2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
          >
            <SkeletonBar width="1.5rem" height="1rem" delay={0.5 + i * 0.1} />
            <SkeletonBar width="100%" height="0.5rem" delay={0.6 + i * 0.1} />
            <SkeletonBar width="70%" height="0.75rem" delay={0.7 + i * 0.1} />
          </motion.div>
        ))}
      </div>
      <div className="px-5 mt-6 space-y-3">
        <SkeletonBar width="30%" height="0.75rem" delay={0.6} />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="glass-card rounded-xl p-3 space-y-2 flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.08 }}
            >
              <SkeletonBar width="1.5rem" height="1.5rem" delay={0.8 + i * 0.08} />
              <SkeletonBar width="80%" height="0.5rem" delay={0.9 + i * 0.08} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
