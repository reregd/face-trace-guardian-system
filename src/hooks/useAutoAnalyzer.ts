import { useEffect, useState } from 'react';
import { useBucketAnalyzer } from './useBucketAnalyzer';
import { useFaceDatabase } from './useFaceDatabase';

export function useAutoAnalyzer() {
  const [hasAnalyzedReligion, setHasAnalyzedReligion] = useState(false);
  const { analyzeBucket, isAnalyzing } = useBucketAnalyzer();
  const { faces, loading } = useFaceDatabase();

  useEffect(() => {
    const analyzeReligionBucket = async () => {
      // Check if religion bucket has already been analyzed
      const religionFaces = faces.filter(face => 
        face.metadata?.source === 'bucket_analysis' && 
        face.metadata?.bucket === 'religion'
      );

      // If no faces from religion bucket and not currently analyzing, start analysis
      if (religionFaces.length === 0 && !isAnalyzing && !hasAnalyzedReligion && !loading) {
        console.log('Auto-analyzing religion bucket...');
        try {
          setHasAnalyzedReligion(true);
          const result = await analyzeBucket('religion');
          console.log('Auto-analysis complete:', result);
        } catch (error) {
          console.error('Auto-analysis failed:', error);
          setHasAnalyzedReligion(false); // Allow retry
        }
      }
    };

    // Only run if faces are loaded and we haven't analyzed yet
    if (!loading && faces.length >= 0) {
      analyzeReligionBucket();
    }
  }, [faces, loading, isAnalyzing, hasAnalyzedReligion, analyzeBucket]);

  return {
    isAutoAnalyzing: isAnalyzing && !hasAnalyzedReligion,
    hasAnalyzedReligion
  };
}