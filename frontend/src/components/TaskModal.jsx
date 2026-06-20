import React, { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';

const TaskModal = ({ task, isOpen, onClose, onUpdate }) => {
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !task) return null;

  const startEditDetails = () => {
    setEditName(task.name || task.title || '');
    setEditDescription(task.description || '');
    setIsEditingDetails(true);
  };

  const handleSaveDetails = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    const updatedTask = {
      ...task,
      name: editName.trim(),
      description: editDescription.trim(),
    };
    await onUpdate(updatedTask);
    setIsEditingDetails(false);
    setIsSaving(false);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const updatedTask = {
        ...task,
        comments: [...(task.comments || []), { id: Date.now(), text: newComment, author: 'You', time: 'now' }]
      };
      onUpdate(updatedTask);
      setNewComment('');
      setIsAddingComment(false);
    }
  };

  const commentCount = Array.isArray(task.comments) ? task.comments.length : 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-bg rounded-lg shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-bg">
          <div className="flex-1 pr-4">
            {isEditingDetails ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xl font-bold text-text bg-bg-tertiary px-3 py-2 rounded border border-input-border outline-none focus:border-input-border-focus"
                  placeholder="Task name"
                  autoFocus
                />
                <p className="text-sm text-text-secondary">{task.column}</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-text mb-2 flex items-center gap-3">
                  {task.name || task.title}
                  <button
                    onClick={startEditDetails}
                    className="p-1 text-text-secondary hover:text-text-accent hover:bg-bg-tertiary rounded transition-colors"
                    title="Edit task"
                  >
                    <Edit3 size={16} />
                  </button>
                </h2>
                <p className="text-sm text-text-secondary">{task.column}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditingDetails && (
              <>
                <button
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                  className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Save"
                >
                  <Save size={18} />
                </button>
                <button
                  onClick={() => setIsEditingDetails(false)}
                  disabled={isSaving}
                  className="p-2 text-text-secondary hover:bg-bg-tertiary rounded transition-colors"
                  title="Cancel"
                >
                  <X size={18} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text text-2xl font-light transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {isEditingDetails ? (
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 rounded-lg border-2 border-input-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors resize-none text-sm leading-relaxed"
                placeholder="Add a description..."
              />
            </div>
          ) : (
            task.description && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Description</h3>
                <p className="text-sm text-text-secondary leading-relaxed bg-bg-tertiary p-3 rounded">
                  {task.description}
                </p>
              </div>
            )
          )}
          
          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">
                Labels
              </h3>

              <div className="flex gap-2 flex-wrap">
                {task.labels.map((label) => (
                  <span
                    key={label.id}
                    className="px-3 py-1 text-xs font-bold rounded uppercase text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}


          {/* Due Date */}
          {task.dueDate && (
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Due Date</h3>
              <div className="flex items-center gap-2 text-sm text-text-secondary bg-bg-tertiary p-3 rounded w-fit">
                📅 {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          )}

          {/* Assigned Members */}
          {task.assignedMembers && task.assignedMembers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Assigned To</h3>
              <div className="flex gap-2 flex-wrap">
                {task.assignedMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 bg-bg-tertiary px-3 py-2 rounded border border-border">
                    <div className="w-6 h-6 rounded-full bg-button text-white text-[10px] font-bold flex items-center justify-center">
                      {member.initials}
                    </div>
                    <span className="text-sm text-text-secondary">{member.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Attachments</h3>
              <div className="space-y-2">
                {task.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href="#"
                    className="flex items-center gap-3 p-2 bg-bg-tertiary rounded border border-border hover:bg-bg-secondary transition-colors group"
                  >
                    <span className="text-lg">📎</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-accent group-hover:underline truncate">{attachment.name}</p>
                      <p className="text-xs text-text-secondary">{attachment.size}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-3">
              Comments <span className="text-text-secondary">({commentCount})</span>
            </h3>
            
            <div className="space-y-3 mb-4">
              {Array.isArray(task.comments) && task.comments.map((comment) => (
                <div key={comment.id} className="bg-bg-tertiary p-3 rounded border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-button text-white text-[10px] font-bold flex items-center justify-center">
                        {comment.author.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-text">{comment.author}</span>
                    </div>
                    <span className="text-xs text-text-secondary">{comment.time}</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{comment.text}</p>
                </div>
              ))}
            </div>

            {/* Add Comment Form */}
            <div className="border-t border-border pt-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 bg-bg-tertiary border border-border rounded text-sm text-text placeholder-text-secondary resize-none focus:outline-none focus:border-input-border-focus transition-colors"
                rows="3"
              />
              {newComment.trim() && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleAddComment}
                    className="px-4 py-2 bg-button hover:bg-button-hover text-white text-sm font-medium rounded transition-colors"
                  >
                    Comment
                  </button>
                  <button
                    onClick={() => setNewComment('')}
                    className="px-4 py-2 bg-button-secondary text-button-secondary-text hover:bg-button-secondary-hover text-sm font-medium rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskModal;
