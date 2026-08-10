import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeContextProvider } from './context/ThemeContext';
import { AuthContextProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Landing from './components/auth/Landing';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import RequireAuth from './components/auth/RequireAuth';
import AppLayout from './components/layout/AppLayout';
import WorkspaceLayout from './components/layout/WorkspaceLayout';
import HomeDashboard from './components/dashboard/HomeDashboard';
import Tasks from './components/dashboard/Tasks';
import WorkspacesList from './components/workspace/WorkspacesList';
import WorkspaceOverview from './components/workspace/WorkspaceOverview';
import AnnouncementList from './components/announcements/AnnouncementList';
import ChatList from './components/chat/ChatList';
import Board from './components/board/Board';
import AcceptInvitation from './components/invitation/AcceptInvitation';
import Settings from './components/settings/Settings';
import ConfigErrorFallback from './components/common/ConfigErrorFallback';
import NotFound from './components/common/NotFound';
import { envConfig } from './lib/envConfig';

function App() {
  if (!envConfig.isValid) {
    return <ConfigErrorFallback errors={envConfig.errors} />;
  }

  return (
    <AuthContextProvider>
      <Router>
        <ThemeContextProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/invitations/:invitationId" element={<AcceptInvitation />} />

              {/* Global app pages wrapped in AppLayout */}
              <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route path="/dashboard" element={<HomeDashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/workspaces" element={<WorkspacesList />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Workspace-scoped pages wrapped in WorkspaceLayout */}
              <Route path="/workspaces/:workspaceId" element={<RequireAuth><WorkspaceLayout /></RequireAuth>}>
                <Route index element={<WorkspaceOverview />} />
                <Route path="chat" element={<ChatList />} />
                <Route path="announcements" element={<AnnouncementList />} />
                <Route path="boards/:boardId" element={<Board />} />
              </Route>

              {/* Catch-all 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </ThemeContextProvider>
      </Router>
    </AuthContextProvider>
  );
}

export default App;