import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { Settings, Info, Save, Edit3, X } from 'lucide-react';
import { workspaceService } from '../services/index.js';

const WorkspaceOverview = () => {
  const { activeWorkspace, updateWorkspace } = useWorkspace();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [fullWorkspace, setFullWorkspace] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch full details (which includes memberships) if not fully populated
  useEffect(() => {
    const loadDetails = async () => {
      if (activeWorkspace?.id) {
        setIsLoadingDetails(true);
        const res = await workspaceService.getWorkspaceById(activeWorkspace.id);
        if (res.success) {
          setFullWorkspace(res.data);
        }
        setIsLoadingDetails(false);
      }
    };
    loadDetails();
  }, [activeWorkspace?.id]);

  const displayWorkspace = fullWorkspace || activeWorkspace;

  // Determine if the current user has owner permissions
  const isOwner = displayWorkspace?.memberships?.some(
    (m) => m.role === 'OWNER' && m.user?.id === user?.id
  ) || displayWorkspace?.role === 'OWNER' || displayWorkspace?.type === 'personal'; // Usually personal workspaces are owned by the user

  // Initialize form data when workspace changes or editing starts
  useEffect(() => {
    if (displayWorkspace) {
      setFormData({
        name: displayWorkspace.name || '',
        description: displayWorkspace.description || ''
      });
    }
  }, [displayWorkspace, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Workspace name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateWorkspace(displayWorkspace.id, formData);
      if (result.success) {
        setIsEditing(false);
        setFullWorkspace(result.data); // Update local details
      } else {
        setError(result.error || 'Failed to update workspace');
      }
    } catch (err) {
      setError('An error occurred while updating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!displayWorkspace) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-bg p-8 sm:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-text mb-2 flex items-center gap-3">
              <Info className="text-text-secondary" />
              Workspace Overview
            </h1>
            <p className="text-text-secondary">View and manage your workspace details.</p>
          </div>
          {isOwner && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg text-sm font-bold text-text transition-colors shadow-sm"
            >
              <Edit3 size={16} /> Edit Details
            </button>
          )}
        </header>

        <div className="bg-bg-secondary rounded-2xl border border-border p-8 shadow-sm mb-8">
          {!isEditing ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Workspace Name</h3>
                <p className="text-xl font-bold text-text">{displayWorkspace.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Description</h3>
                <p className="text-text-secondary whitespace-pre-wrap">
                  {displayWorkspace.description || 'No description provided.'}
                </p>
              </div>
              <div className="flex gap-12 pt-4 border-t border-border">
                <div>
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Type</h3>
                  <p className="text-sm font-semibold capitalize text-text">{displayWorkspace.type}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Created</h3>
                  <p className="text-sm font-semibold text-text">
                    {new Date(displayWorkspace.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors"
                  placeholder="Enter workspace name"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors resize-none"
                  placeholder="Add a description..."
                />
              </div>

              {error && (
                <div className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg font-bold text-text-secondary hover:bg-bg-tertiary transition-colors flex items-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg font-bold bg-button hover:bg-button-hover text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Save size={18} />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Team Members Section */}
        {displayWorkspace.type === 'team' && (
          <div className="bg-bg-secondary rounded-2xl border border-border p-8 shadow-sm">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Workspace Members</h3>
            {isLoadingDetails ? (
              <p className="text-sm text-text-secondary">Loading members...</p>
            ) : displayWorkspace.memberships && displayWorkspace.memberships.length > 0 ? (
              <div className="space-y-3">
                {displayWorkspace.memberships.map((membership) => (
                  <div key={membership.user?.id || Math.random()} className="flex items-center justify-between p-3 bg-bg rounded-lg border border-border-light">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-button flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {(membership.user?.fullName || membership.user?.email || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text">{membership.user?.fullName || 'Unknown User'}</p>
                        <p className="text-xs text-text-secondary">{membership.user?.email || ''}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${
                      membership.role === 'OWNER' ? 'bg-label-team-bg text-label-team-text' : 'bg-bg-tertiary text-text-secondary'
                    }`}>
                      {membership.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No members found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceOverview;
