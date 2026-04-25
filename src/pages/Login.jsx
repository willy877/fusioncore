import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isSignUp
      ? await signUp(email, password, { data: { username: email.split('@')[0] } })
      : await signIn(email, password);
    setLoading(false);

    if (!error) {
      if (!isSignUp) {
        navigate('/dashboard');
      }
    }
  };

  const handleGoogle = async () => {
    await signInWithGoogle();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4"
    >
      <Helmet>
        <title>{isSignUp ? 'Registro' : 'Iniciar Sesión'} - Fusion Core</title>
        <meta name="description" content={isSignUp ? 'Regístrate en Fusion Core' : 'Inicia sesión en Fusion Core para acceder a tu dashboard'} />
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
          {isSignUp ? 'Regístrate' : 'Inicia Sesión'}
        </h1>
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
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" disabled={loading}>
            {loading ? 'Cargando...' : (isSignUp ? 'Registrarse' : 'Iniciar Sesión')}
          </Button>
        </form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-600"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-transparent text-gray-400">o continúa con</span></div>
        </div>
        <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-md transition mb-4">
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
          Continuar con Google
        </button>
        <div className="text-center mt-4">
          {!isSignUp && (
            <Link to="/forgot-password" className="text-sm text-blue-400 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          )}
        </div>
        <p className="text-center text-gray-400 mt-2">
          {isSignUp ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
          <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="text-blue-400 hover:text-blue-300">
            {isSignUp ? 'Inicia Sesión' : 'Regístrate'}
          </Button>
        </p>
      </div>
    </motion.div>
  );
};

export default Login;