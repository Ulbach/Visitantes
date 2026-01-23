
import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Zap } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    async function setupCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          // Fixed: Corrected invalid property names from '理想' to 'ideal' for MediaTrackConstraints.
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        currentStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Erro ao acessar câmera:", err);
        alert("Não foi possível acessar a câmera.");
        onClose();
      }
    }
    setupCamera();
    return () => {
      // Cleanup: Ensure the camera tracks are stopped when the component unmounts.
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) onCapture(blob);
        }, 'image/jpeg', 0.85);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Guia Visual */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-10">
        <div className="w-full aspect-[1.6/1] border-2 border-dashed border-white/50 rounded-2xl relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1 rounded-br-lg" />
        </div>
      </div>

      <div className="absolute top-10 left-0 w-full px-6 flex justify-between items-center">
        <button onClick={onClose} className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full">Enquadre o Documento</span>
        <div className="w-12 h-12" /> {/* Spacer */}
      </div>

      <div className="absolute bottom-12 left-0 w-full flex flex-col items-center gap-6">
        <button 
          onClick={takePhoto}
          className="w-20 h-20 bg-white rounded-full p-1 border-4 border-white/30 active:scale-90 transition-transform flex items-center justify-center"
        >
          <div className="w-full h-full bg-white rounded-full border-4 border-slate-900 flex items-center justify-center">
            <Camera className="w-8 h-8 text-slate-900" />
          </div>
        </button>
        <p className="text-white/60 text-xs font-medium">Capture uma foto nítida para processamento</p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
