import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invitationService } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext';

const AcceptInvitation = () => {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [invite, setInvite] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const res = await invitationService.getInvitationById(invitationId);
      if (res.success) {
        setInvite(res.data);
      } else {
        setError(res.error || 'Invitation not found or expired');
      }
      setIsLoading(false);
    };
    load();
  }, [invitationId]);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError('');

    const res = await invitationService.acceptInvitation(invitationId);
    if (res.success) {
      setAccepted(true);
    } else {
      setError(res.error || 'Failed to accept invitation');
    }
    setIsAccepting(false);
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-secondary">Loading invitation...</div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest rounded-DEFAULT border border-outline-variant p-8 shadow-sm max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="font-headline-md text-xl font-bold text-on-surface mb-2">Invalid Invitation</h2>
          <p className="font-body-md text-secondary mb-6">{error}</p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-2 bg-primary text-on-primary hover:opacity-90 font-label-caps text-xs font-bold uppercase tracking-wider rounded-DEFAULT transition-opacity"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest rounded-DEFAULT border border-outline-variant p-8 shadow-sm max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="font-headline-md text-xl font-bold text-on-surface mb-2">You're in!</h2>
          <p className="font-body-md text-secondary mb-6">
            You have joined <strong className="text-on-surface">{invite?.workspace?.name}</strong>.
          </p>
          <button
            onClick={() => navigate(`/workspaces/${invite?.workspace?.id}`)}
            className="px-6 py-2 bg-primary text-on-primary hover:opacity-90 font-label-caps text-xs font-bold uppercase tracking-wider rounded-DEFAULT transition-opacity"
          >
            Go to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-DEFAULT border border-outline-variant p-8 shadow-sm max-w-md w-full text-center">
        <div className="text-5xl mb-4">📨</div>
        <h2 className="font-headline-md text-xl font-bold text-on-surface mb-2">You're Invited!</h2>
        <p className="font-body-md text-secondary mb-1">
          <strong className="text-on-surface">{invite?.workspace?.name}</strong>
        </p>
        <p className="font-body-sm text-sm text-secondary mb-6">
          {invite?.workspace?.description || 'Join this workspace on Domate.'}
        </p>

        {!isAuthenticated ? (
          <div className="space-y-3">
            <p className="font-body-sm text-sm text-secondary">
              Sign in or create an account to accept this invitation.
            </p>
            <Link
              to={`/login?redirect=/invitations/${invitationId}`}
              className="inline-block px-6 py-2 bg-primary text-on-primary hover:opacity-90 font-label-caps text-xs font-bold uppercase tracking-wider rounded-DEFAULT transition-opacity"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-error-container border border-error rounded-DEFAULT text-xs font-body-sm text-on-error-container">
                {error}
              </div>
            )}
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="px-8 py-2.5 bg-primary text-on-primary hover:opacity-90 font-label-caps text-xs font-bold uppercase tracking-wider rounded-DEFAULT transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAccepting ? 'Accepting...' : 'Accept Invitation'}
            </button>
          </>
        )}

        <div className="mt-6">
          <Link to="/dashboard" className="font-body-sm text-sm text-secondary hover:text-on-surface underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
