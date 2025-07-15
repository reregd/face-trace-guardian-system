import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from './ui/button';
import { Camera, CameraOff, Scan, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Detection {
  id: string;
  name: string;
  confidence: number;
  timestamp: Date;
  location?: { lat: number; lng: number };
  image: string;
  box: { x: number; y: number; width: number; height: number };
}

interface FaceDetectionProps {
  onDetection: (detection: Detection) => void;
  isActive: boolean;
  mode: 'identification' | 'training' | 'stealth';
}

export function FaceDetection({ onDetection, isActive, mode }: FaceDetectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate face recognition database for demo
  const knownFaces = [
    { id: '1', name: 'Agent Smith', descriptor: 'mock-descriptor-1' },
    { id: '2', name: 'Target Alpha', descriptor: 'mock-descriptor-2' },
    { id: '3', name: 'Subject Beta', descriptor: 'mock-descriptor-3' },
  ];

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'; // You'll need to add face-api.js models to public/models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsLoaded(true);
      } catch (err) {
        console.error('Error loading face detection models:', err);
        // For demo purposes, we'll proceed without models
        setIsLoaded(true);
        setError('Models not loaded - using simulation mode');
      }
    };

    loadModels();
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Prefer rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        
        if (isActive) {
          startDetection();
        }

        toast({
          title: "Camera Active",
          description: `${mode} mode activated`,
        });
      }
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    stopDetection();
  };

  const startDetection = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      await detectFaces();
    }, 2000); // Check every 2 seconds
  };

  const stopDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      // For demo: simulate face detection
      const simulatedDetection = Math.random() > 0.7; // 30% chance of detection

      if (simulatedDetection) {
        // Simulate detection box
        const box = {
          x: Math.random() * (canvas.width - 200),
          y: Math.random() * (canvas.height - 200),
          width: 150 + Math.random() * 100,
          height: 150 + Math.random() * 100
        };

        // Draw detection box
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = mode === 'stealth' ? 'transparent' : '#10b981';
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Simulate face recognition
        const isKnownFace = Math.random() > 0.5;
        const matchedFace = isKnownFace ? knownFaces[Math.floor(Math.random() * knownFaces.length)] : null;

        // Capture image
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        const captureCtx = captureCanvas.getContext('2d');
        captureCtx?.drawImage(video, 0, 0);

        // Get location if available
        let location: { lat: number; lng: number } | undefined;
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch {
          // Location not available
        }

        const detection: Detection = {
          id: matchedFace?.id || `unknown-${Date.now()}`,
          name: matchedFace?.name || 'Unknown Subject',
          confidence: 0.7 + Math.random() * 0.3,
          timestamp: new Date(),
          location,
          image: captureCanvas.toDataURL('image/jpeg', 0.8),
          box
        };

        setDetectionCount(prev => prev + 1);
        onDetection(detection);

        // Visual feedback
        if (mode !== 'stealth') {
          ctx.fillStyle = matchedFace ? '#3b82f6' : '#f59e0b';
          ctx.font = '16px monospace';
          ctx.fillText(
            `${detection.name} (${(detection.confidence * 100).toFixed(0)}%)`,
            box.x,
            box.y - 10
          );
        }

        // Audio alert for matches
        if (matchedFace && mode !== 'stealth') {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D0r2oeBDSH0fDVfTEGKXrH8N6PQQoWYbvz7KNOFANKo+TyrGYeBjWK1O/QfDEGKXzL8t2QQQoWYbPz7qRPEwxGr+j4r2YeBjWL2O/QfDEGK3zK8d2QQQoWYbXs76RPEwxGquj4rmYeBjiOz+/VfzIGKXrH8N6PQQkWY7vy66NSFANKpe/1rWYeBjSJ0O/VfzIGKXrH8N6PQQkWZLJs55ZLEgNKrt/vw3kiBDOOzu7ZfjQHL3LD6tqWTA8PV73s6qBVEgpDpOf0r2seBjWJ0++ZgkYUR7LzylpsWwUxk9vp2YIzACJi2+PetVwqhvhPAAAA'); // Simple beep
          audio.volume = 0.3;
          audio.play().catch(() => {});
        }
      }
    } catch (err) {
      console.error('Detection error:', err);
    }
  };

  useEffect(() => {
    if (isActive && isStreaming) {
      startDetection();
    } else {
      stopDetection();
    }

    return () => stopDetection();
  }, [isActive, isStreaming]);

  return (
    <div className="relative w-full h-full bg-background rounded-lg overflow-hidden shadow-tactical">
      {/* Camera View */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        />
        
        {/* Detection Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ display: mode === 'stealth' ? 'none' : 'block' }}
        />

        {/* Scan Line Effect (not in stealth mode) */}
        {isActive && isStreaming && mode !== 'stealth' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-60 animate-scan-line" />
        )}

        {/* Status Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-mono ${
            isStreaming 
              ? 'bg-accent text-accent-foreground' 
              : 'bg-destructive text-destructive-foreground'
          }`}>
            {isStreaming ? 'LIVE' : 'OFFLINE'}
          </div>
          
          {isActive && (
            <div className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-mono">
              SCANNING
            </div>
          )}

          <div className="px-3 py-1 bg-card/80 text-card-foreground rounded-full text-xs font-mono">
            Mode: {mode.toUpperCase()}
          </div>

          {detectionCount > 0 && (
            <div className="px-3 py-1 bg-warning/20 text-warning rounded-full text-xs font-mono">
              Detections: {detectionCount}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-destructive/90 text-destructive-foreground p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          {!isStreaming ? (
            <Button
              onClick={startCamera}
              variant="tactical"
              size="icon"
              disabled={!isLoaded}
            >
              <Camera className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={stopCamera}
              variant="danger"
              size="icon"
            >
              <CameraOff className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* No Stream Placeholder */}
      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="text-center">
            <Scan className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Camera Offline</p>
            <Button
              onClick={startCamera}
              variant="tactical"
              disabled={!isLoaded}
            >
              <Camera className="w-4 h-4 mr-2" />
              Activate Camera
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}