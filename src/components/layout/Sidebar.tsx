import { LayoutGrid, Kanban, Calendar, Video, Users, Settings, Camera } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: any) => void;
  sidebarOpen: boolean;
}

export default function Sidebar({ currentPage, setCurrentPage, sidebarOpen }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'projects', label: 'Projects', icon: Kanban },
    { id: 'calendar', label: 'Shoot Calendar', icon: Calendar },
    { id: 'content', label: 'Content Calendar', icon: Video },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div
      className={cn(
        'bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className={cn('p-4 border-b border-slate-800 flex items-center gap-3', !sidebarOpen && 'justify-center')}>
        <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
          <Camera className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && <h1 className="font-bold text-lg text-white">Bosroller</h1>}
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                currentPage === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}
              title={!sidebarOpen ? item.label : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
