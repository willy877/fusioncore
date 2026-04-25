import React from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
const QrCodeDisplay = () => {
  const {
    toast
  } = useToast();
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const installUrl = `${appUrl}/install`;
  const downloadQRCode = () => {
    const canvas = document.getElementById('react-qrcode-canvas-dashboard');
    if (canvas) {
      try {
        const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'fusion-core-install-qr.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast({
          title: 'Descargado',
          description: 'El código QR de instalación se ha guardado como imagen.'
        });
      } catch (error) {
        console.error("Error downloading QR Code:", error);
        toast({
          variant: 'destructive',
          title: 'Error de Descarga',
          description: 'No se pudo descargar el código QR. Esto puede deberse a restricciones del navegador.'
        });
      }
    }
  };
  const copyUrl = () => {
    navigator.clipboard.writeText(installUrl).then(() => {
      toast({
        title: 'Copiado',
        description: 'La URL de instalación se ha copiado al portapapeles.'
      });
    }, () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo copiar la URL.'
      });
    });
  };
  return <div className="glass-effect p-6 rounded-2xl shadow-lg w-full text-center flex flex-col items-center justify-between h-full">
        <div>
            <div className="flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6 text-purple-400 mr-2" />
                <h2 className="text-xl font-bold gradient-text">Ingresa a la pagina</h2>
            </div>
            <p className="text-gray-400 mb-4 text-sm">Escanea para ingresar a la pagina web</p>
        </div>
      
        <motion.div className="p-3 bg-white rounded-lg inline-block shadow-inner mb-4" whileHover={{
      scale: 1.05
    }} transition={{
      type: "spring",
      stiffness: 300
    }}>
            <QRCodeCanvas id="react-qrcode-canvas-dashboard" value={installUrl} size={160} bgColor={"#ffffff"} fgColor={"#0f172a"} level={"H"} includeMargin={true} imageSettings={{
        src: "https://horizons-cdn.hostinger.com/8e1e982a-c308-4c75-8199-bde51fad9b5d/2b8d5ab21bab4158e49df68be53f44fc.jpg",
        height: 30,
        width: 30,
        excavate: true,
        crossOrigin: 'anonymous' // Fix for tainted canvas
      }} />
        </motion.div>

        <div className="w-full">
            <p className="text-gray-500 text-xs break-all mb-4 px-2">{installUrl}</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={copyUrl} variant="secondary" size="sm" className="flex-1 bg-gray-700/60 hover:bg-gray-600/60 border-none">
                    <Copy className="mr-2 h-4 w-4" /> Copiar
                </Button>
                <Button onClick={downloadQRCode} size="sm" className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    <Download className="mr-2 h-4 w-4" /> Descargar
                </Button>
            </div>
        </div>
    </div>;
};
export default QrCodeDisplay;