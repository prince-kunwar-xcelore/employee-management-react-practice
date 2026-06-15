import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { StatsResponse } from '@rbac/shared';
import { useEffect, useState } from 'react';

function StatsCard({
  count,
  name,
}: {
  role: string;
  count: number;
  name: string;
}) {
  return (
    <Card>
      <CardContent className="flex gap-2 items-end">
        <h4 className="text-muted-foreground text-base font-medium">{name}</h4>
        <h3 className="font-semibold text-2xl">{count}</h3>
      </CardContent>
    </Card>
  );
}

const roleDisplayMap = {
  employee: 'Employees',
  team_lead: 'Team Leads',
  manager: 'Managers',
  admin: 'Admins',
};

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse['stats'] | null>(null);

  useEffect(() => {
    api.users
      .stats()
      .then((res) => {
        setStats(res.stats);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <div className="p-6">
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(stats).map(([role, count]) => (
            <StatsCard
              key={role}
              role={role}
              count={count}
              name={roleDisplayMap[role as keyof typeof stats]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
