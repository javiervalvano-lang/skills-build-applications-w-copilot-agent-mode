import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  _id?: string;
  name: string;
  mascot?: string;
  members?: Array<string | { _id?: string; name?: string; email?: string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const response = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (isMounted) {
          setTeams(response.teams ?? []);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError('Unable to load teams');
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
    <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error} empty={teams.length === 0} emptyText="No teams">
      {teams.length > 0 && (
        <ul className="list-group list-group-flush">
          {teams.map((team) => (
            <li key={team._id ?? team.name} className="list-group-item">
              <strong>{team.name}</strong>
              {team.members && team.members.length > 0 && <span> · {team.members.length} members</span>}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
