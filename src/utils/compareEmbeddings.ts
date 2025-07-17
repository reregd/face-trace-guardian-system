/**
 * Utility functions for comparing face embeddings
 */

export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  const dot = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
  const norm2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
  
  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }
  
  return dot / (norm1 * norm2);
}

export function euclideanDistance(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  return Math.sqrt(
    vec1.reduce((sum, v, i) => sum + Math.pow(v - vec2[i], 2), 0)
  );
}

/**
 * Calculate the distance between two face descriptors
 * Returns a value between 0 and 1, where 0 is identical and 1 is completely different
 */
export function faceDistance(descriptor1: Float32Array, descriptor2: number[]): number {
  const vec1 = Array.from(descriptor1);
  return euclideanDistance(vec1, descriptor2);
}