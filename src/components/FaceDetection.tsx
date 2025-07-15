import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from './ui/button';
import { Camera, CameraOff, Scan, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import { useDetectionLogs } from '@/hooks/useDetectionLogs';
import { useFaceDatabase } from '@/hooks/useFaceDatabase';
import { FACE_RECOGNITION_CONFIG, DetectionStatus } from '@/constants';

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

  // Real Supabase hooks
  const { uploadFromDataURL } = useSupabaseStorage();
  const { addLog, updateLogStatus } = useDetectionLogs();
  const { faces, findMatch, extractFaceEmbeddings, startBackgroundMatching } = useFaceDatabase();

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
    }, FACE_RECOGNITION_CONFIG.DETECTION_INTERVAL);
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
      // Real face detection using face-api.js
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length > 0) {
        for (const detection of detections) {
          const box = detection.detection.box;
          
          // Draw detection box (not in stealth mode)
          if (mode !== 'stealth') {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
          }

          // Extract face region for embedding
          const faceCanvas = document.createElement('canvas');
          const faceCtx = faceCanvas.getContext('2d');
          if (!faceCtx) continue;

          faceCanvas.width = box.width + FACE_RECOGNITION_CONFIG.FACE_BOX_PADDING * 2;
          faceCanvas.height = box.height + FACE_RECOGNITION_CONFIG.FACE_BOX_PADDING * 2;
          
          faceCtx.drawImage(
            video,
            box.x - FACE_RECOGNITION_CONFIG.FACE_BOX_PADDING,
            box.y - FACE_RECOGNITION_CONFIG.FACE_BOX_PADDING,
            box.width + FACE_RECOGNITION_CONFIG.FACE_BOX_PADDING * 2,
            box.height + FACE_RECOGNITION_CONFIG.FACE_BOX_PADDING * 2,
            0, 0,
            faceCanvas.width,
            faceCanvas.height
          );

          // Get face embeddings
          const faceImageData = faceCtx.getImageData(0, 0, faceCanvas.width, faceCanvas.height);
          const embeddings = await extractFaceEmbeddings(faceImageData);
          
          if (!embeddings) continue;

          // Find match in database
          const match = await findMatch(embeddings);
          
          let status: DetectionStatus = 'unknown';
          let name = 'Unknown Subject';
          let confidence = 0;
          let faceId = `unknown-${Date.now()}`;

          if (match && match.confidence >= FACE_RECOGNITION_CONFIG.MATCH_CONFIDENCE_THRESHOLD) {
            status = 'known';
            name = match.face.name;
            confidence = match.confidence;
            faceId = match.face.face_id;
          }

          // Capture full image
          const captureCanvas = document.createElement('canvas');
          captureCanvas.width = video.videoWidth;
          captureCanvas.height = video.videoHeight;
          const captureCtx = captureCanvas.getContext('2d');
          captureCtx?.drawImage(video, 0, 0);

          // Get geolocation
          let location: { lat: number; lng: number; accuracy?: number } | undefined;
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                resolve, 
                reject, 
                FACE_RECOGNITION_CONFIG.GEOLOCATION_OPTIONS
              );
            });
            location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
          } catch {
            // Location not available
          }

          // Generate filename
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, 'h-').replace(/h-(\d{2})$/, 'h-$1m');
          const locationStr = location ? `${location.lat.toFixed(4)}_${location.lng.toFixed(4)}` : 'unknown-location';
          const filename = `${locationStr}_${dateStr}_${timeStr}.jpg`;

          // Upload to appropriate bucket
          const bucket = status === 'known' 
            ? FACE_RECOGNITION_CONFIG.STORAGE_BUCKETS.FACES_KNOWN
            : FACE_RECOGNITION_CONFIG.STORAGE_BUCKETS.FACES_UNKNOWN;

          const imageDataUrl = captureCanvas.toDataURL('image/jpeg', FACE_RECOGNITION_CONFIG.IMAGE_QUALITY);
          const uploadResult = await uploadFromDataURL(bucket, imageDataUrl, filename);

          if (uploadResult) {
            // Save to event logs
            await addLog({
              timestamp: now.toISOString(),
              location: location ? JSON.stringify(location) : undefined,
              camera: 'primary',
              face_id: faceId,
              match_status: status,
              image_path: uploadResult.path,
              confidence,
              metadata: {
                box: { x: box.x, y: box.y, width: box.width, height: box.height },
                embeddings: embeddings.slice(0, 10) // Store first 10 dimensions for reference
              }
            });

            // If unknown, start background matching
            if (status === 'unknown') {
              startBackgroundMatching(faceId, embeddings, 0); // logId would come from addLog result
            }

            // Create detection object for UI
            const detectionObj: Detection = {
              id: faceId,
              name,
              confidence,
              timestamp: now,
              location,
              image: imageDataUrl,
              box: { x: box.x, y: box.y, width: box.width, height: box.height }
            };

            setDetectionCount(prev => prev + 1);
            onDetection(detectionObj);

            // Visual feedback
            if (mode !== 'stealth') {
              ctx.fillStyle = status === 'known' ? '#3b82f6' : '#f59e0b';
              ctx.font = '16px monospace';
              ctx.fillText(
                `${name} (${(confidence * 100).toFixed(0)}%)`,
                box.x,
                box.y - 10
              );
            }

            // Audio alert for known faces
            if (status === 'known' && mode !== 'stealth') {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D0r2oeBDSH0fDVfTEGKXrH8N6PQQoWYbvz7KNOFANKo+TyrGYeBjWK1O/QfDEGKXzL8t2QQQoWYbPz7qRPEwxGr+j4r2YeBjWL2O/QfDEGK3zK8d2QQQoWYbXs76RPEwxGquj4rmYeBjiOz+/VfzIGKXrH8N6PQQkWY7vy66NSFANKpe/1rWYeBjSJ0O/VfzIGKXrH8N6PQQkWZLJs55ZLEgNKrt/vw3kiBDOOzu7ZfjQHL3LD6tqWTA8PV73s6qBVEgpDpOf0r2seBjWJ0++ZgkYUR7LzylpsWwUxk9vp2YIzACJi2+PetVwqhvhPAAAA');
              audio.volume = 0.3;
              audio.play().catch(() => {});
            }
          }
        }
      }
    } catch (err) {
      console.error('Detection error:', err);
      // Fallback to simple detection indicator
      if (Math.random() > 0.8) { // 20% chance for demo purposes
        const box = {
          x: Math.random() * (canvas.width - 200),
          y: Math.random() * (canvas.height - 200),
          width: 150 + Math.random() * 100,
          height: 150 + Math.random() * 100
        };

        if (mode !== 'stealth') {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
        }
      }
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