import { Menu, Bell, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface TopBarProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
  userEmail: string;
  onLogout: () => void;
}

export default function TopBar({ onMenuClick, sidebarOpen, userEmail, onLogout }: TopBarProps) {
  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="text-slate-400 hover:text-slate-200">
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h2 className="text-lg font-semibold text-white">Bosroller Studio</h2>
          <p className="text-xs text-slate-400">Creator Project Management</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-200 relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-slate-400 hover:text-slate-200 gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm hidden sm:inline">{userEmail.split('@')[0]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-800 border-slate-700">
            <DropdownMenuItem onClick={onLogout} className="text-slate-200 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
