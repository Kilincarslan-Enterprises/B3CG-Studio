import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ContentPost, Project } from '../types';
import { Video, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function ContentCalendar() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, projectsRes] = await Promise.all([
        supabase.from('content_posts').select('*').order('scheduled_date', { ascending: true }),
        supabase.from('projects').select('*'),
      ]);

      if (postsRes.data) setPosts(postsRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = (weekOffset: number) => {
    const today = new Date();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() + i);
      return date;
    });
  };

  const weekDays = getWeekDays(selectedWeek);
  const platformColors: Record<string, string> = {
    TikTok: 'bg-black text-white',
    Instagram: 'bg-pink-600 text-white',
    YouTube: 'bg-red-600 text-white',
  };

  const statusColors: Record<string, string> = {
    Edited: 'bg-blue-600',
    Scheduled: 'bg-yellow-600',
    Published: 'bg-green-600',
  };

  if (loading) {
    return <div className="p-6 text-slate-400">Loading content calendar...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Video className="w-8 h-8" />
          Content Calendar
        </h1>
        <p className="text-slate-400">Plan and schedule your content across platforms</p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Week of {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
            {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedWeek(selectedWeek - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedWeek(selectedWeek + 1)}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, dayIndex) => {
            const dayPosts = posts.filter((p) => {
              const postDate = new Date(p.scheduled_date);
              return (
                postDate.getDate() === day.getDate() &&
                postDate.getMonth() === day.getMonth() &&
                postDate.getFullYear() === day.getFullYear()
              );
            });

            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <div
                key={dayIndex}
                className={`rounded-lg border p-4 min-h-64 flex flex-col ${
                  isToday ? 'bg-blue-900 border-blue-500' : 'bg-slate-700 border-slate-600'
                }`}
              >
                <h3 className={`font-semibold mb-4 ${isToday ? 'text-blue-200' : 'text-slate-200'}`}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  <br />
                  <span className="text-2xl">{day.getDate()}</span>
                </h3>

                <div className="space-y-2 flex-1">
                  {dayPosts.map((post) => {
                    const project = projects.find((p) => p.id === post.project_id);
                    return (
                      <div key={post.id} className="text-xs space-y-1">
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-1 rounded text-white font-semibold ${platformColors[post.platform]}`}>
                            {post.platform}
                          </span>
                          <span className={`px-2 py-1 rounded text-white font-semibold ${statusColors[post.status]}`}>
                            {post.status}
                          </span>
                        </div>
                        <p className="text-slate-200 break-words">{project?.title}</p>
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-blue-400 hover:text-blue-300 w-full justify-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Post
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">All Scheduled Posts</h2>
        <div className="space-y-3">
          {posts.slice(0, 10).map((post) => {
            const project = projects.find((p) => p.id === post.project_id);
            return (
              <div key={post.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-white">{project?.title}</p>
                  <p className="text-sm text-slate-400">
                    {new Date(post.scheduled_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded text-sm font-semibold text-white ${platformColors[post.platform]}`}>
                    {post.platform}
                  </span>
                  <span className={`px-3 py-1 rounded text-sm font-semibold text-white ${statusColors[post.status]}`}>
                    {post.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
