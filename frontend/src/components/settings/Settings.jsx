import React, { useState } from 'react';
import ProfileTab from './ProfileTab';
import InvitationsTab from './InvitationsTab';
import SecurityTab from './SecurityTab';
import AppearanceTab from './AppearanceTab';

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'invitations', label: 'Invitations' },
  { key: 'security', label: 'Security' },
  { key: 'appearance', label: 'Appearance' },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="border-b border-border px-8 pt-6">
        <h1 className="text-2xl font-bold text-text mb-1">Settings</h1>
        <p className="text-sm text-text-secondary mb-4">Manage your account settings and preferences</p>

        <div className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'text-text border-b-2 border-button'
                  : 'text-text-secondary hover:text-text border-b-2 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'invitations' && <InvitationsTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
      </div>
    </div>
  );
};

export default Settings;
