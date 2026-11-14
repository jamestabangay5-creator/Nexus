import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Sparkles } from 'lucide-react';
import { compressEvidenceImage } from '../../utils/imageUtils';

interface RealtimeCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string, caption?: string) => void;
}

export const RealtimeCameraModal: React.FC<RealtimeCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Stop active media stream tracks
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setIsInitializing(true);
    setErrorMessage(null);
    stopStream();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Direct live camera streaming is not supported on this browser. You can use your native device camera instead.');
      setIsInitializing(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.warn('Realtime camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser settings or use the native camera option below.');
      } else {
        setErrorMessage('Could not open camera stream. Your device may be using the camera in another app.');
      }
      setIsInitializing(false);
    }
  };

  // Effect to manage stream on open/close and camera facingMode toggle
  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, capturedPhoto]);

  // Flip front/back camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Shutter Snap
  const handleSnapPhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    // Trigger visual flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhoto(rawDataUrl);
    stopStream();
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    setErrorMessage(null);
  };

  // Confirm and attach photo
  const handleConfirmPhoto = async () => {
    if (!capturedPhoto) return;
    setIsCompressing(true);
    try {
      // Compress if needed
      onCapture(capturedPhoto, `Live Camera Capture (${new Date().toLocaleTimeString()})`);
      handleClose();
    } catch {
      onCapture(capturedPhoto, `Live Camera Capture`);
      handleClose();
    } finally {
      setIsCompressing(false);
    }
  };

  // Close modal and cleanup
  const handleClose = () => {
    stopStream();
    setCapturedPhoto(null);
    setErrorMessage(null);
    onClose();
  };

  // Native fallback file capture
  const handleNativeCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const compressed = await compressEvidenceImage(file);
        onCapture(compressed, file.name);
        handleClose();
      } catch {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (typeof evt.target?.result === 'string') {
            onCapture(evt.target.result, file.name);
            handleClose();
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[92vh]">
        {/* Top Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                <span>Real-Time Incident Camera</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Live View
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Capture live evidence directly for Bongabong emergency response
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            aria-label="Close Camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Video Feed Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[380px] overflow-hidden select-none">
          {/* Flash Effect */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-30 animate-pulse pointer-events-none" />
          )}

          {/* Captured Review Preview */}
          {capturedPhoto ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedPhoto}
                alt="Captured Incident"
                className="max-h-[380px] w-auto max-w-full object-contain mx-auto"
              />
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Photo Captured!</span>
              </div>
            </div>
          ) : errorMessage ? (
            /* Error State with fallback options */
            <div className="p-6 text-center max-w-sm space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">Camera Notice</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{errorMessage}</p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => nativeInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                  <span>Launch Native Camera App</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Retry Camera Stream
                </button>
              </div>
            </div>
          ) : (
            /* Live Video Stream with Viewfinder Reticle */
            <div className="relative w-full h-full flex items-center justify-center">
              {isInitializing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 gap-2">
                  <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-300 font-medium">Starting Camera...</span>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full max-h-[380px] object-cover"
              />

              {/* Viewfinder Target Reticle Overlay */}
              <div className="absolute inset-8 sm:inset-12 pointer-events-none border border-white/20 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl-sm" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr-sm" />
                </div>
                <div className="flex justify-center items-center">
                  <div className="w-6 h-6 border border-white/40 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl-sm" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br-sm" />
                </div>
              </div>

              {/* Watermark badge */}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300 border border-white/10 pointer-events-none">
                Bongabong Emergency OPS · {facingMode === 'environment' ? 'Rear Cam' : 'Front Cam'}
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Hidden native input for instant fallback */}
        <input
          ref={nativeInputRef}
          type="file"
          accept="image/*"
          capture={facingMode}
          onChange={handleNativeCapture}
          className="hidden"
        />

        {/* Bottom Control Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          {capturedPhoto ? (
            /* Review Controls */
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                disabled={isCompressing}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-900/30 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{isCompressing ? 'Attaching...' : 'Use This Photo'}</span>
              </button>
            </div>
          ) : (
            /* Live Camera Controls */
            <div className="w-full flex items-center justify-between gap-3">
              {/* Flip camera */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition cursor-pointer"
                title="Switch Front / Rear Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={handleSnapPhoto}
                disabled={isInitializing || !!errorMessage}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-red-900/40 active:scale-95 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-w-[170px]"
              >
                <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
                <span>Capture Photo</span>
              </button>

              {/* Mobile Native App Fallback Button */}
              <button
                type="button"
                onClick={() => nativeInputRef.current?.click()}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition cursor-pointer"
                title="Launch Native Mobile Camera App"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

