import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Project, Shoot } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Flame, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, shootsRes] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('shoots').select('*'),
      ]);

      if (projectsRes.data) setProjects(projectsRes.data);
      if (shootsRes.data) setShoots(shootsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['Ideas', 'Planned', 'In Production', 'Finished', 'Posted'];
  const projectsByStatus = statuses.map((status) => ({
    status,
    count: projects.filter((p) => p.status === status).length,
  }));

  const upcomingShoot = shoots
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .find((s) => new Date(s.date) > new Date());

  const stats = [
    {
      label: 'Total Projects',
      value: projects.length,
      icon: Zap,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'In Production',
      value: projects.filter((p) => p.status === 'In Production').length,
      icon: Flame,
      color: 'from-orange-500 to-red-600',
    },
    {
      label: 'Completed',
      value: projects.filter((p) => p.status === 'Finished').length,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'Upcoming Shoots',
      value: shoots.filter((s) => new Date(s.date) > new Date()).length,
      icon: Clock,
      color: 'from-purple-500 to-pink-600',
    },
  ];

  if (loading) {
    return <div className="p-6 text-slate-400">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back! Here's your project overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Projects by Status</CardTitle>
            <CardDescription className="text-slate-400">Distribution of your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="status" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Next Shoot</CardTitle>
            <CardDescription className="text-slate-400">Upcoming schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingShoot ? (
              <>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Date</p>
                  <p className="text-lg font-semibold text-white">
                    {new Date(upcomingShoot.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {upcomingShoot.time && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Time</p>
                    <p className="text-lg font-semibold text-white">{upcomingShoot.time}</p>
                  </div>
                )}
                {upcomingShoot.location && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Location</p>
                    <p className="text-sm text-slate-200">{upcomingShoot.location}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-400 text-sm">No upcoming shoots scheduled</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription className="text-slate-400">Your latest project updates</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div>
                      <p className="font-medium text-white text-sm">{project.title}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-600 text-xs font-semibold text-white rounded">
                      {project.status}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
