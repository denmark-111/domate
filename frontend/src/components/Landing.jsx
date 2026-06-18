import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Icons
const CheckIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
  </svg>
);

const TaskIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const TeamIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm6-11a2 2 0 100-4 2 2 0 000 4zm3 5a3 3 0 10-6 0v2a3 3 0 006 0v-2z" />
  </svg>
);

const SparkIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect authenticated users to dashboard
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const features = [
    {
      icon: <TaskIcon />,
      title: 'Smart Task Management',
      description: 'Organize tasks with boards, lists, and cards. Track progress in real-time with visual status indicators.'
    },
    {
      icon: <TeamIcon />,
      title: 'Team Collaboration',
      description: 'Work together seamlessly. Assign tasks, leave comments, and keep everyone on the same page.'
    },
    {
      icon: <SparkIcon />,
      title: 'Productivity Features',
      description: 'Labels, due dates, priorities, and custom workflows to match your team\'s unique process.'
    }
  ];

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-button text-white font-bold flex items-center justify-center">
              B
            </div>
            <span className="text-xl font-bold">Board-Done</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-text-secondary hover:text-text transition">
              Features
            </button>
            <button className="text-text-secondary hover:text-text transition">
              Pricing
            </button>
            <button className="text-text-secondary hover:text-text transition">
              About
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 rounded-lg bg-bg-secondary text-text hover:bg-bg-tertiary transition font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="mb-6 inline-block px-4 py-2 rounded-full bg-label-feature-bg">
          <span className="text-label-feature-text text-sm font-semibold">✨ The easiest way to organize</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Your Team's Productivity 
          <span className="block text-text-accent">Starts Here</span>
        </h1>
        
        <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
          Board-Done helps teams organize, plan, and track their work with intuitive boards, lists, and cards. Simple, powerful, and built for collaboration.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-3 bg-button hover:bg-button-hover text-white font-semibold rounded-lg transition-colors"
          >
            Get Started Free
          </button>
          <button className="px-8 py-3 border-2 border-border text-text font-semibold rounded-lg hover:bg-bg-secondary transition-colors">
            Watch Demo
          </button>
        </div>

        {/* Hero Metrics */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div>
            <div className="text-3xl font-bold text-text-accent">10k+</div>
            <div className="text-text-secondary">Active Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-text-accent">50k+</div>
            <div className="text-text-secondary">Tasks Completed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-text-accent">99.9%</div>
            <div className="text-text-secondary">Uptime</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border">
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
                className="p-8 rounded-xl bg-bg-secondary border border-border hover:border-text-accent transition-colors group"
              >
                <div className="mb-4 text-text-accent group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-12 text-center">Why Choose Board-Done?</h2>
          
          <div className="space-y-4">
            {[
              'Beautiful, intuitive interface that your team will love',
              'Real-time collaboration with instant updates',
              'Flexible workflows that adapt to your process',
              'Powerful integrations with your favorite tools',
              'Mobile-friendly design for work on the go',
              'Advanced security and data privacy'
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-bg-secondary">
                <div className="mt-1 text-text-accent flex-shrink-0">
                  <CheckIcon />
                </div>
                <p className="text-lg text-text">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 text-center bg-bg-secondary rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to boost your productivity?</h2>
          <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of teams using Board-Done to organize their work and achieve their goals.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-4 bg-button hover:bg-button-hover text-white font-semibold rounded-lg transition-colors text-lg"
          >
            Start Your Free Trial
          </button>
          <p className="text-text-secondary mt-4">No credit card required. Sign up in seconds.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-button text-white font-bold flex items-center justify-center text-sm">
                  B
                </div>
                <span className="font-bold">Board-Done</span>
              </div>
              <p className="text-text-secondary">The easiest way to manage your team's work.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <div className="space-y-2 text-text-secondary">
                <button className="hover:text-text transition block">Features</button>
                <button className="hover:text-text transition block">Pricing</button>
                <button className="hover:text-text transition block">Security</button>
                <button className="hover:text-text transition block">Roadmap</button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2 text-text-secondary">
                <button className="hover:text-text transition block">About</button>
                <button className="hover:text-text transition block">Blog</button>
                <button className="hover:text-text transition block">Careers</button>
                <button className="hover:text-text transition block">Contact</button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <div className="space-y-2 text-text-secondary">
                <button className="hover:text-text transition block">Privacy</button>
                <button className="hover:text-text transition block">Terms</button>
                <button className="hover:text-text transition block">Cookies</button>
                <button className="hover:text-text transition block">Licenses</button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between text-text-secondary">
            <p>&copy; 2026 Board-Done. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <button className="hover:text-text transition">Twitter</button>
              <button className="hover:text-text transition">GitHub</button>
              <button className="hover:text-text transition">LinkedIn</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
