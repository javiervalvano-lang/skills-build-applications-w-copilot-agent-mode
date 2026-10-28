import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const response = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (isMounted) {
          setSuggestions(response.suggestions ?? []);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError('Unable to load workout suggestions');
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
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loading={loading} error={error} empty={suggestions.length === 0} emptyText="No workout suggestions">
      {suggestions.length > 0 && (
        <ul className="list-group list-group-flush">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title}-${index}`} className="list-group-item">
              <strong>{suggestion.title}</strong>
              {suggestion.focus && <div>{suggestion.focus}</div>}
              {suggestion.reason && <small>{suggestion.reason}</small>}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
