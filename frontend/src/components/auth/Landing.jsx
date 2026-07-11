import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLogo from '../common/AppLogo';
import { Check, ClipboardList, Users, Zap } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const features = [
    {
      icon: <ClipboardList size={32} />,
      title: 'Smart Task Management',
      description: 'Organize tasks with boards, lists, and cards. Track progress in real-time with visual status indicators.'
    },
    {
      icon: <Users size={32} />,
      title: 'Team Collaboration',
      description: 'Work together seamlessly. Assign tasks, leave comments, and keep everyone on the same page.'
    },
    {
      icon: <Zap size={32} />,
      title: 'Productivity Features',
      description: 'Labels, due dates, priorities, and custom workflows to match your team\'s unique process.'
    }
  ];

  return (
    <div className="min-h-screen bg-bg text-text">
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" />
            <span className="text-xl font-bold">Domate</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 rounded-lg border border-border text-text hover:bg-bg-secondary transition font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth?action=register')}
              className="px-4 py-2 rounded-lg bg-button hover:bg-button-hover text-white font-medium transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Your Projects, Boards, and Team{' '}
          <span className="text-text-accent">— All in One Place</span>
        </h1>

        <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
          Domate is a real-time collaborative project management tool. Organize work with
          Kanban boards, stay connected with built-in team chat, and move faster together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-3 bg-button hover:bg-button-hover text-white font-semibold rounded-lg transition-colors"
          >
            Get Started
          </button>
        </div>
      </section>

      <section className="py-20 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Everything you need to manage projects, collaborate with your team, and deliver great work.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-xl bg-bg border border-border hover:border-text-accent transition-colors group overflow-hidden"
              >
                <div className="mb-4 text-text-accent group-hover:scale-110 transition-transform origin-left">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-12 text-center">Built for Real Work</h2>

          <div className="space-y-4">
            {[
              'Real-time collaborative boards with instant updates',
              'Kanban-style task management with drag and drop',
              'Built-in team chat and announcements',
              'Custom labels, due dates, and priority tracking',
              'Dark mode and customizable workspaces',
              'Free for everyone — no hidden costs'
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-bg-secondary">
                <div className="mt-1 text-text-accent flex-shrink-0">
                  <Check size={24} />
                </div>
                <p className="text-lg text-text">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center bg-bg-secondary rounded-xl p-12">
          <h2 className="text-3xl font-bold mb-4">Start building your first board</h2>
          <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
            Domate is free and ready to use. Sign up and start organizing your work in seconds.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-4 bg-button hover:bg-button-hover text-white font-semibold rounded-lg transition-colors text-lg"
          >
            Get Started
          </button>
        </div>
      </section>

      <footer className="border-t border-border py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <AppLogo size="xs" />
              <span className="font-bold">Domate</span>
            </div>
            <div className="flex gap-6">
              <button className="text-text-secondary hover:text-text transition">Twitter</button>
              <button className="text-text-secondary hover:text-text transition">GitHub</button>
              <button className="text-text-secondary hover:text-text transition">LinkedIn</button>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex justify-center text-text-secondary text-sm">
            <p>&copy; 2026 Domate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
