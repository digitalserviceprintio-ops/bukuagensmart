import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME, APP_VERSION } from '@/constants/app';
import logo from '@/assets/logo.png';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] gradient-hero flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <motion.div
              className="relative w-28 h-28 flex items-center justify-center mb-4"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-white/20 blur-2xl"
                animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.4, 0.75, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.img
                src={logo}
                alt={APP_NAME}
                className="relative w-28 h-28 object-contain drop-shadow-2xl"
                initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
                animate={{ scale: [1, 1.06, 1], rotate: [-2, 2, -2], opacity: 1 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
            <h1 className="text-2xl font-bold text-primary-foreground mb-1 font-display">{APP_NAME}</h1>
            <p className="text-primary-foreground/60 text-sm">Manajemen Tarik Tunai & Setor Tunai</p>
            <div className="mt-8">
              <motion.div
                className="w-8 h-8 border-[3px] border-primary-foreground/30 border-t-primary-foreground rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <p className="text-primary-foreground/40 text-xs mt-6">v{APP_VERSION}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
