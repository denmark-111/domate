import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invitationService } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext';

const AcceptInvitation = () => {
  const { token } = useParams();
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
      const res = await invitationService.getInvitationByToken(token);
      if (res.success) {
        setInvite(res.data);
      } else {
        setError(res.error || 'Invitation not found or expired');
      }
      setIsLoading(false);
    };
    load();
  }, [token]);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError('');

    const res = await invitationService.acceptInvitation(token);
    if (res.success) {
      setAccepted(true);
    } else {
      setError(res.error || 'Failed to accept invitation');
    }
    setIsAccepting(false);
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-secondary">Loading invitation...</div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-bg-secondary rounded-2xl border border-border p-8 shadow-sm max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-bold text-text mb-2">Invalid Invitation</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-2 rounded-lg font-bold bg-button hover:bg-button-hover text-white transition-colors shadow-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-bg-secondary rounded-2xl border border-border p-8 shadow-sm max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-text mb-2">You're in!</h2>
          <p className="text-text-secondary mb-6">
            You have joined <strong className="text-text">{invite?.workspace?.name}</strong>.
          </p>
          <button
            onClick={() => navigate(`/workspaces/${invite?.workspace?.id}`)}
            className="px-6 py-2 rounded-lg font-bold bg-button hover:bg-button-hover text-white transition-colors shadow-sm"
          >
            Go to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-bg-secondary rounded-2xl border border-border p-8 shadow-sm max-w-md w-full text-center">
        <div className="text-5xl mb-4">📨</div>
        <h2 className="text-xl font-bold text-text mb-2">You're Invited!</h2>
        <p className="text-text-secondary mb-1">
          <strong className="text-text">{invite?.workspace?.name}</strong>
        </p>
        <p className="text-sm text-text-secondary mb-6">
          {invite?.workspace?.description || 'Join this workspace on Board Done.'}
        </p>

        {!isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Sign in or create an account to accept this invitation.
            </p>
            <Link
              to={`/auth?redirect=/invitations/${token}`}
              className="inline-block px-6 py-2 rounded-lg font-bold bg-button hover:bg-button-hover text-white transition-colors shadow-sm"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text">
                {error}
              </div>
            )}
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="px-8 py-2.5 rounded-lg font-bold bg-button hover:bg-button-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isAccepting ? 'Accepting...' : 'Accept Invitation'}
            </button>
          </>
        )}

        <div className="mt-6">
          <Link to="/dashboard" className="text-sm text-text-secondary hover:text-text underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
