import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import Dashboard from './Dashboard';
import Projects from './Projects';
import Calendar from './Calendar';
import ContentCalendar from './ContentCalendar';
import Team from './Team';
import Settings from './Settings';

type PageType = 'dashboard' | 'projects' | 'calendar' | 'content' | 'team' | 'settings';

interface Session {
  user: {
    id: string;
    email?: string;
  };
}

export default function MainApp({ session }: { session: Session }) {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (session?.user?.email) {
      setUserEmail(session.user.email);
    }
  }, [session]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <Projects />;
      case 'calendar':
        return <Calendar />;
      case 'content':
        return <ContentCalendar />;
      case 'team':
        return <Team />;
      case 'settings':
        return <Settings session={session} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          userEmail={userEmail}
          onLogout={async () => {
            await supabase.auth.signOut();
          }}
        />
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
