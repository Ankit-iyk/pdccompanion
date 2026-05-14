import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { Toaster } from 'react-hot-toast';

export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-navy-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a2035',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
}
