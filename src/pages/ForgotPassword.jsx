import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendPasswordResetEmail } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await sendPasswordResetEmail(email);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4"
    >
      <Helmet>
        <title>Restablecer Contraseña - Fusion Core</title>
        <meta name="description" content="Restablece tu contraseña de Fusion Core" />
      </Helmet>
      <div className="glass-effect p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src="https://horizons-cdn.hostinger.com/8e1e982a-c308-4c75-8199-bde51fad9b5d/2b8d5ab21bab4158e49df68be53f44fc.jpg"
            alt="Fusion Core Logo"
            className="h-16 w-auto"
          />
        </div>
        <h1 className="text-3xl font-bold text-center gradient-text mb-6">
          Restablecer Contraseña
        </h1>
        <p className="text-center text-gray-400 mb-6">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="tu@email.com"
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Enlace'}
          </Button>
        </form>
        <p className="text-center text-gray-400 mt-4">
          ¿Recordaste tu contraseña?
          <Link to="/login" className="text-blue-400 hover:text-blue-300 ml-2">
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;