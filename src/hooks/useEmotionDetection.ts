import { useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

interface EmotionResult {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

interface AgeGenderResult {
  age: number;
  gender: 'male' | 'female';
  genderProbability: number;
}

export function useEmotionDetection() {
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const loadModels = useCallback(async () => {
    if (modelsLoaded) return;
    
    setLoading(true);
    try {
      await Promise.all([
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        faceapi.nets.ageGenderNet.loadFromUri('/models')
      ]);
      setModelsLoaded(true);
    } catch (error) {
      console.error('Error loading emotion/age/gender models:', error);
    }
    setLoading(false);
  }, [modelsLoaded]);

  const detectEmotionsAndAge = useCallback(async (
    video: HTMLVideoElement
  ): Promise<{ emotions: EmotionResult; ageGender: AgeGenderResult } | null> => {
    if (!modelsLoaded) {
      await loadModels();
    }

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions()
        .withAgeAndGender();

      if (!detection) return null;

      const emotions = detection.expressions as EmotionResult;
      const ageGender: AgeGenderResult = {
        age: Math.round(detection.age),
        gender: detection.gender as 'male' | 'female',
        genderProbability: detection.genderProbability
      };

      return { emotions, ageGender };
    } catch (error) {
      console.error('Error detecting emotions/age/gender:', error);
      return null;
    }
  }, [modelsLoaded, loadModels]);

  return {
    detectEmotionsAndAge,
    loadModels,
    loading,
    modelsLoaded
  };
}