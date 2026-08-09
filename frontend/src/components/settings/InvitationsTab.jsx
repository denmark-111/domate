import { useState, useEffect } from 'react';
import { Loader, Check, X, ExternalLink, Mail } from 'lucide-react';
import { invitationService } from '../../services/index.js';
import Button from '../common/Button';

const InvitationsTab = () => {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    let active = true;
    invitationService.getMyInvitations().then((result) => {
      if (!active) return;
      if (result.success) {
        setInvitations(result.data || []);
      } else {
        setError(result.error || 'Failed to load invitations');
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleAccept = async (id) => {
    setActionLoading(id);
    setError('');

    const result = await invitationService.acceptInvitation(id);
    if (result.success) {
      setStatuses((prev) => ({
        ...prev,
        [id]: { state: 'accepted', workspaceId: result.data?.workspace?.id },
      }));
    } else {
      setError(result.error || 'Failed to accept invitation');
    }
    setActionLoading(null);
  };

  const handleDecline = async (id) => {
    setActionLoading(id);
    setError('');

    const result = await invitationService.declineInvitation(id);
    if (result.success) {
      setStatuses((prev) => ({ ...prev, [id]: { state: 'declined' } }));
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
        <Loader size={20} className="animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-headline-md text-lg font-semibold text-on-surface mb-1">
          Workspace Invitations
        </h2>
        <p className="font-body-sm text-sm text-secondary">
          View and manage pending invitations to join workspaces.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-error-container text-on-error-container border border-error/30 rounded-DEFAULT text-sm font-medium mb-4">
          {error}
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="border border-dashed border-outline-variant bg-surface-container-low/40 rounded-DEFAULT p-10 text-center flex flex-col items-center justify-center gap-2">
          <Mail size={32} className="text-secondary opacity-50 mb-1" />
          <p className="font-body-md text-sm font-medium text-on-surface">No pending invitations</p>
          <p className="font-body-sm text-xs text-secondary max-w-sm">
            When colleagues or team members invite you to collaborate on workspaces, your pending invites will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => {
            const status = statuses[inv.id];

            return (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-DEFAULT bg-surface-container-low border border-outline-variant transition-all hover:border-outline shadow-2xs"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline-md text-sm font-semibold text-on-surface truncate">
                    {inv.workspace?.name || 'Unknown Workspace'}
                  </h3>
                  <p className="font-body-sm text-xs text-secondary mt-0.5">
                    Invited by <span className="font-medium text-on-surface">{inv.invitedBy?.fullName || inv.invitedBy?.email || 'someone'}</span> on {formatDate(inv.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {status?.state === 'accepted' ? (
                    <a href={`/workspaces/${status.workspaceId}`}>
                      <Button variant="primary" size="sm">
                        <ExternalLink size={13} />
                        Visit Workspace
                      </Button>
                    </a>
                  ) : status?.state === 'declined' ? (
                    <span className="font-label-caps text-xs px-3 py-1.5 border border-outline-variant text-secondary rounded-DEFAULT font-bold uppercase">
                      Declined
                    </span>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAccept(inv.id)}
                        disabled={actionLoading === inv.id}
                      >
                        {actionLoading === inv.id ? (
                          <Loader size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDecline(inv.id)}
                        disabled={actionLoading === inv.id}
                      >
                        <X size={13} />
                        Decline
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvitationsTab;

