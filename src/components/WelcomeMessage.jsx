import React from 'react';
import { motion } from 'framer-motion';

const WelcomeMessage = ({ username }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-effect p-6 rounded-xl text-center"
    >
      <h1 className="text-4xl font-bold gradient-text mb-2">
        ¡Bienvenido de nuevo, {username || 'Usuario'}!
      </h1>
      <p className="text-gray-300 text-lg">
        Explora las últimas actualizaciones y mantente conectado.
      </p>
    </motion.div>
  );
};

export default WelcomeMessage;