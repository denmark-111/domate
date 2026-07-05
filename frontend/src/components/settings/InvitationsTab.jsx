import React, { useState, useEffect, useCallback } from 'react';
import { Loader, Check, X, ArrowRight } from 'lucide-react';
import { invitationService } from '../../services/index.js';
import { useNavigate } from 'react-router-dom';

const InvitationsTab = () => {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchInvitations = useCallback(async () => {
    setIsLoading(true);
    setError('');

    const result = await invitationService.getMyInvitations();
    if (result.success) {
      setInvitations(result.data || []);
    } else {
      setError(result.error || 'Failed to load invitations');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleAccept = async (id) => {
    setActionLoading(id);
    setError('');

    const result = await invitationService.acceptInvitation(id);
    if (result.success) {
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } else {
      setError(result.error || 'Failed to accept invitation');
    }
    setActionLoading(null);
  };

  const handleDecline = async (id) => {
    setActionLoading(id);
    setError('');

    const result = await invitationService.revokeInvitation(id);
    if (result.success) {
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } else {
      setError(result.error || 'Failed to decline invitation');
    }
    setActionLoading(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader size={24} className="animate-spin text-text-secondary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold text-text mb-4">Pending Invitations</h2>
      <p className="text-sm text-text-secondary mb-6">
        Invitations to join workspaces will appear here.
      </p>

      {error && (
        <div className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text mb-6">
          {error}
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <p className="text-text-secondary font-medium">No pending invitations</p>
          <p className="text-sm text-text-secondary mt-1">
            When someone invites you to a workspace, it will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-secondary"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text truncate">
                  {inv.workspace?.name || 'Unknown Workspace'}
                </p>
                <p className="text-sm text-text-secondary">
                  Invited by {inv.invitedBy?.fullName || inv.invitedBy?.email || 'someone'}{' '}
                  on {formatDate(inv.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button
                  onClick={() => handleAccept(inv.id)}
                  disabled={actionLoading === inv.id}
                  className="px-4 py-2 rounded-lg font-bold text-sm bg-button hover:bg-button-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {actionLoading === inv.id ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(inv.id)}
                  disabled={actionLoading === inv.id}
                  className="px-4 py-2 rounded-lg font-bold text-sm text-text-secondary hover:bg-bg-tertiary border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <X size={14} />
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvitationsTab;
