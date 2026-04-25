import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { User, Palette, Lock, Bell, Sparkles, Gamepad2, DollarSign, Wrench, HelpCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Settings = ({ onLogout }) => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Configuración guardada",
      description: "Tus cambios han sido guardados exitosamente"
    });
  };

  const handleFeature = () => {
    toast({
      description: "🚧 Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
  };

  const settingsSections = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'privacy', label: 'Privacidad', icon: Lock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'ai', label: 'IA', icon: Sparkles },
    { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
    { id: 'monetization', label: 'Monetización', icon: DollarSign },
    { id: 'advanced', label: 'Avanzado', icon: Wrench },
    { id: 'support', label: 'Soporte', icon: HelpCircle }
  ];

  return (
    <Layout onLogout={onLogout}>
      <Helmet>
        <title>Configuración - Fusion Core</title>
        <meta name="description" content="Personaliza tu experiencia en Fusion Core con control total sobre todas las funcionalidades" />
      </Helmet>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">Configuración</h1>
          <p className="text-gray-400">Personaliza tu experiencia</p>
        </motion.div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 bg-slate-800/50 gap-1">
            {settingsSections.map((section) => (
              <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                <section.icon className="w-4 h-4" />
                <span className="hidden md:inline">{section.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-xl p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">Perfil de Usuario</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Nombre de usuario</Label>
                  <input
                    type="text"
                    className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="Tu nombre de usuario"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Biografía</Label>
                  <textarea
                    className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white resize-none"
                    rows="3"
                    placeholder="Cuéntanos sobre ti..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Perfil público</Label>
                  <Switch onCheckedChange={handleFeature} />
                </div>
                <Button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-600">
                  Guardar Cambios
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="appearance" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-xl p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">Apariencia</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Modo oscuro</Label>
                  <Switch defaultChecked onCheckedChange={handleFeature} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Animaciones</Label>
                  <Switch defaultChecked onCheckedChange={handleFeature} />
                </div>
                <div>
                  <Label className="text-gray-300 mb-3 block">Tema de color</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {['blue', 'purple', 'green', 'orange'].map((color) => (
                      <button
                        key={color}
                        onClick={handleFeature}
                        className={`h-12 rounded-lg bg-gradient-to-r from-${color}-500 to-${color}-600 hover:scale-105 transition-transform`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-xl p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">Privacidad y Seguridad</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Cifrado end-to-end</Label>
                    <p className="text-sm text-gray-500">Protege tus mensajes</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={handleFeature} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Verificación en dos pasos</Label>
                    <p className="text-sm text-gray-500">Seguridad adicional</p>
                  </div>
                  <Switch onCheckedChange={handleFeature} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Mostrar estado en línea</Label>
                    <p className="text-sm text-gray-500">Visible para amigos</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={handleFeature} />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-xl p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">Notificaciones</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Mensajes nuevos</Label>
                  <Switch defaultChecked onCheckedChange={handleFeature} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Logros desbloqueados</Label>
                  <Switch defaultChecked onCheckedChange={handleFeature} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Actualizaciones de NOVA</Label>
                  <Switch defaultChecked onCheckedChange={handleFeature} />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-xl p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">Configuración de IA</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Memoria contextual</Label>
                    <p className="text-sm text-gray-500">NOVA recuerda conversaciones</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={handleFeature} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Tareas automáticas</Label>
                    <p className="text-sm text-gray-500">Automatización inteligente</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={handleFeature} />
                </div>
                <div>
                  <Label className="text-gray-300">Personalidad de NOVA</Label>
                  <select className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    <option>Profesional</option>
                    <option>Amigable</option>
                    <option>Casual</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="gaming" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-xl p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">Zona Gamer</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Notificaciones de logros</Label>
                  <Switch defaultChecked onCheckedChange={handleFeature} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Perfil público en ranking</Label>
                  <Switch defaultChecked onCheckedChange={handleFeature} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Sincronización entre dispositivos</Label>
                  <Switch defaultChecked onCheckedChange={handleFeature} />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="monetization" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-xl p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">Monetización</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Plan Actual: Gratuito</h3>
                  <p className="text-sm text-gray-400 mb-4">Actualiza a Premium para desbloquear funciones avanzadas</p>
                  <Button onClick={handleFeature} className="bg-gradient-to-r from-yellow-500 to-orange-500">
                    Actualizar a Premium
                  </Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Beneficios Premium:</h4>
                  <ul className="space-y-1 text-sm text-gray-400">
                    <li>✓ Sin anuncios</li>
                    <li>✓ IA avanzada con más capacidades</li>
                    <li>✓ Temas exclusivos</li>
                    <li>✓ Almacenamiento ilimitado</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="advanced" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-xl p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">Centro Avanzado</h2>
              <div className="space-y-4">
                <Button onClick={handleFeature} variant="outline" className="w-full justify-start">
                  Exportar datos
                </Button>
                <Button onClick={handleFeature} variant="outline" className="w-full justify-start">
                  Importar configuración
                </Button>
                <Button onClick={handleFeature} variant="outline" className="w-full justify-start text-red-400 hover:text-red-300">
                  Eliminar cuenta
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-xl p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">Soporte</h2>
              <div className="space-y-4">
                <Button onClick={handleFeature} variant="outline" className="w-full justify-start">
                  Centro de ayuda
                </Button>
                <Button onClick={handleFeature} variant="outline" className="w-full justify-start">
                  Reportar un problema
                </Button>
                <Button onClick={handleFeature} variant="outline" className="w-full justify-start">
                  Contactar soporte
                </Button>
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-sm text-gray-400">Versión 1.0.0</p>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;