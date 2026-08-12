import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import ErrorBoundary from '../common/ErrorBoundary';

const AppLayout = () => {
  return (
    <div className="flex flex-col h-dvh font-sans">
      <Topbar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <ErrorBoundary compact title="Failed to load page content" message="An unexpected error occurred while loading this view.">
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default AppLayout;
