import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const response = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (isMounted) {
          setEntries(response.leaderboard ?? []);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError('Unable to load leaderboard');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => { isMounted = false; };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error} empty={entries.length === 0} emptyText="No leaderboard">
      {entries.length > 0 && (
        <ol className="mb-0 ps-3">
          {entries.map((entry) => (
            <li key={`${entry.teamName}-${entry.rank}`}>
              {entry.teamName} — {entry.totalPoints} pts (rank {entry.rank})
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
