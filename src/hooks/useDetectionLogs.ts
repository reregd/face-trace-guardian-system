import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DetectionStatus } from '@/constants';

export interface DetectionLog {
  id?: number;
  timestamp: string;
  location?: string;
  camera?: string;
  face_id: string;
  match_status: DetectionStatus;
  image_path: string;
  confidence?: number;
  metadata?: any;
  created_at?: string;
}

export function useDetectionLogs() {
  const [logs, setLogs] = useState<DetectionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLog = async (log: Omit<DetectionLog, 'id' | 'created_at'>): Promise<DetectionLog | null> => {
    try {
      setError(null);
      
      const { data, error: insertError } = await supabase
        .from('event_logs')
        .insert([log])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local state
      setLogs(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      console.error('Add log error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add log');
      return null;
    }
  };

  const updateLogStatus = async (
    id: number, 
    newStatus: DetectionStatus, 
    newImagePath?: string
  ): Promise<boolean> => {
    try {
      setError(null);
      
      const updateData: any = { match_status: newStatus };
      if (newImagePath) {
        updateData.image_path = newImagePath;
      }

      const { error: updateError } = await supabase
        .from('event_logs')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setLogs(prev => prev.map(log => 
        log.id === id 
          ? { ...log, match_status: newStatus, ...(newImagePath && { image_path: newImagePath }) }
          : log
      ));

      return true;
    } catch (err) {
      console.error('Update log error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update log');
      return false;
    }
  };

  const loadLogs = async (limit = 50) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('event_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setLogs(data || []);
    } catch (err) {
      console.error('Load logs error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const searchLogs = async (filters: {
    startDate?: string;
    endDate?: string;
    status?: DetectionStatus;
    camera?: string;
    location?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('event_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.status) {
        query = query.eq('match_status', filters.status);
      }
      if (filters.camera) {
        query = query.eq('camera', filters.camera);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLogs(data || []);
    } catch (err) {
      console.error('Search logs error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search logs');
    } finally {
      setLoading(false);
    }
  };

  const deleteLogs = async (logIds: number[]) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('event_logs')
        .delete()
        .in('id', logIds);

      if (deleteError) throw deleteError;

      // Update local state
      setLogs(prev => prev.filter(log => !logIds.includes(log.id!)));

      return true;
    } catch (err) {
      console.error('Delete logs error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete logs');
      return false;
    }
  };

  // Load logs on mount
  useEffect(() => {
    loadLogs();
  }, []);

  return {
    logs,
    loading,
    error,
    addLog,
    updateLogStatus,
    loadLogs,
    searchLogs,
    deleteLogs
  };
}