import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shoot, Project } from '../types';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [shootsRes, projectsRes] = await Promise.all([
        supabase.from('shoots').select('*'),
        supabase.from('projects').select('*'),
      ]);

      if (shootsRes.data) setShoots(shootsRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const getShootsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return shoots.filter((s) => s.date === dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  if (loading) {
    return <div className="p-6 text-slate-400">Loading calendar...</div>;
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <CalendarIcon className="w-8 h-8" />
          Shoot Calendar
        </h1>
        <p className="text-slate-400">Schedule and manage your filming dates</p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{monthName}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrevMonth}>
              Previous
            </Button>
            <Button variant="outline" onClick={handleNextMonth}>
              Next
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-slate-900 rounded-lg"></div>
          ))}
          {days.map((day) => {
            const dayShoots = getShootsForDate(day);
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setShowModal(true);
                }}
                className={`aspect-square p-2 rounded-lg border transition-colors flex flex-col items-start justify-start gap-1 text-left group ${
                  isToday
                    ? 'bg-blue-600 border-blue-500'
                    : dayShoots.length > 0
                      ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-slate-200'}`}>
                  {day}
                </span>
                {dayShoots.length > 0 && (
                  <div className="w-full space-y-1">
                    {dayShoots.slice(0, 2).map((shoot) => (
                      <div
                        key={shoot.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${
                          isToday ? 'bg-blue-500' : 'bg-blue-600'
                        } text-white`}
                      >
                        Shoot
                      </div>
                    ))}
                    {dayShoots.length > 2 && (
                      <div className="text-xs text-slate-300">+{dayShoots.length - 2} more</div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {getShootsForDate(parseInt(selectedDate.split('-')[2])).map((shoot) => {
                const project = projects.find((p) => p.id === shoot.project_id);
                return (
                  <div key={shoot.id} className="p-3 bg-slate-700 rounded-lg">
                    <p className="font-medium text-white">{project?.title || 'Untitled'}</p>
                    {shoot.time && <p className="text-sm text-slate-400">{shoot.time}</p>}
                    {shoot.location && <p className="text-sm text-slate-300">{shoot.location}</p>}
                    {shoot.notes && <p className="text-sm text-slate-400 mt-1">{shoot.notes}</p>}
                  </div>
                );
              })}
              {getShootsForDate(parseInt(selectedDate.split('-')[2])).length === 0 && (
                <p className="text-slate-400 text-sm">No shoots scheduled</p>
              )}
            </div>

            <Button onClick={() => setShowModal(false)} className="w-full bg-blue-600 hover:bg-blue-700">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
