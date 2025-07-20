import { useState, useCallback, useEffect } from 'react';

interface CachedEmbedding {
  id: string;
  embedding: number[];
  timestamp: number;
  metadata?: any;
}

const CACHE_KEY = 'face_embeddings_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export function useEmbeddingCache() {
  const [cache, setCache] = useState<Map<string, CachedEmbedding>>(new Map());
  const [loading, setLoading] = useState(true);

  // Load cache from localStorage
  useEffect(() => {
    const loadCache = () => {
      try {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
          const data = JSON.parse(stored) as CachedEmbedding[];
          const now = Date.now();
          
          // Filter out expired entries
          const validEntries = data.filter(
            item => now - item.timestamp < CACHE_EXPIRY
          );
          
          const cacheMap = new Map(
            validEntries.map(item => [item.id, item])
          );
          
          setCache(cacheMap);
        }
      } catch (error) {
        console.error('Error loading embedding cache:', error);
      }
      setLoading(false);
    };

    loadCache();
  }, []);

  // Save cache to localStorage
  const saveCache = useCallback((newCache: Map<string, CachedEmbedding>) => {
    try {
      const data = Array.from(newCache.values());
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving embedding cache:', error);
    }
  }, []);

  const getCachedEmbedding = useCallback((id: string): number[] | null => {
    const cached = cache.get(id);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
      const newCache = new Map(cache);
      newCache.delete(id);
      setCache(newCache);
      saveCache(newCache);
      return null;
    }
    
    return cached.embedding;
  }, [cache, saveCache]);

  const setCachedEmbedding = useCallback((
    id: string,
    embedding: number[],
    metadata?: any
  ) => {
    const cached: CachedEmbedding = {
      id,
      embedding,
      timestamp: Date.now(),
      metadata
    };
    
    const newCache = new Map(cache);
    newCache.set(id, cached);
    setCache(newCache);
    saveCache(newCache);
  }, [cache, saveCache]);

  const clearCache = useCallback(() => {
    setCache(new Map());
    localStorage.removeItem(CACHE_KEY);
  }, []);

  const getCacheStats = useCallback(() => {
    const size = cache.size;
    const totalSize = JSON.stringify(Array.from(cache.values())).length;
    const oldestEntry = Math.min(
      ...Array.from(cache.values()).map(item => item.timestamp)
    );
    
    return {
      size,
      totalSizeKB: Math.round(totalSize / 1024),
      oldestEntry: size > 0 ? new Date(oldestEntry) : null
    };
  }, [cache]);

  return {
    getCachedEmbedding,
    setCachedEmbedding,
    clearCache,
    getCacheStats,
    loading
  };
}