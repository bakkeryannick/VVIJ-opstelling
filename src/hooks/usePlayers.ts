import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Player } from '../types';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name');

      if (error) throw error;
      setPlayers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij laden spelers');
    } finally {
      setLoading(false);
    }
  }, []);

  const addPlayer = useCallback(async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .insert({ name: name.trim() })
        .select()
        .single();

      if (error) throw error;
      setPlayers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Fout bij toevoegen speler');
    }
  }, []);

  const removePlayer = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPlayers(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Fout bij verwijderen speler');
    }
  }, []);

  useEffect(() => {
    fetchPlayers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        () => {
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPlayers]);

  return {
    players,
    loading,
    error,
    addPlayer,
    removePlayer,
    refetch: fetchPlayers,
  };
}
