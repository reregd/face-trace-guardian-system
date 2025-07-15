// Configuration constants for the facial recognition system
export const FACE_RECOGNITION_CONFIG = {
  // Confidence threshold for face matches (0.85 = 85%)
  MATCH_CONFIDENCE_THRESHOLD: 0.85,
  
  // Detection interval in milliseconds
  DETECTION_INTERVAL: 2000,
  
  // Maximum time to continue background matching for unknown faces (1 hour)
  BACKGROUND_SEARCH_DURATION: 60 * 60 * 1000, // 1 hour in ms
  
  // Face detection box padding
  FACE_BOX_PADDING: 20,
  
  // Image compression quality for storage
  IMAGE_QUALITY: 0.8,
  
  // Supported file formats
  SUPPORTED_FORMATS: {
    images: ['.jpg', '.jpeg', '.png', '.heic'],
    videos: ['.mp4', '.hevc', '.mov', '.avi'],
    documents: ['.pdf', '.doc', '.docx', '.txt']
  },
  
  // Supabase storage buckets
  STORAGE_BUCKETS: {
    FACES_KNOWN: 'faces_known',
    FACES_UNKNOWN: 'faces_unknown',
    DOCUMENTS: 'documents',
    VIDEOS: 'videos',
    LOGS: 'logs'
  },
  
  // Geolocation settings
  GEOLOCATION_OPTIONS: {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 60000
  }
} as const;

export type DetectionStatus = 'known' | 'unknown' | 'pending';