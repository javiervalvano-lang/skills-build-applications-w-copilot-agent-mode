import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  _id?: string;
  type: string;
  minutes: number;
  points?: number;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const response = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (isMounted) {
          setActivities(response.activities ?? []);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError('Unable to load activities');
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
    <CapabilityCard title="Activities" description="Track student activity minutes and points." loading={loading} error={error} empty={activities.length === 0} emptyText="No activities">
      {activities.length > 0 && (
        <ul className="list-group list-group-flush">
          {activities.map((activity) => (
            <li key={activity._id ?? `${activity.type}-${activity.minutes}`} className="list-group-item">
              {activity.type} · {activity.minutes} minutes · {activity.points ?? 0} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
