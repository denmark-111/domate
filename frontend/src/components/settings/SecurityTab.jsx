import React from 'react';
import { Shield } from 'lucide-react';

const SecurityTab = () => {
  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-bold text-text mb-4">Security</h2>

      <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
        <Shield size={48} className="mx-auto text-text-secondary mb-4" />
        <p className="text-text-secondary font-medium">Coming Soon</p>
        <p className="text-sm text-text-secondary mt-1 max-w-sm mx-auto">
          Password management and additional security features will be available here in a future update.
        </p>
      </div>
    </div>
  );
};

export default SecurityTab;
