import { supabaseStorageService } from '../../services/supabaseStorageService';

const WorkspaceIcon = ({ workspace, className = '', containerClassName = '' }) => {
  if (workspace.coverImageUrl) {
    return (
      <div className={`overflow-hidden shrink-0 ${containerClassName}`}>
        <img
          src={supabaseStorageService.getCoverImageUrl(workspace.coverImageUrl)}
          alt={workspace.name}
          className={`w-full h-full object-cover ${className}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center text-white font-bold shrink-0 ${containerClassName}`}
      style={{ backgroundColor: workspace.color || 'var(--color-button)' }}
    >
      {workspace.name[0].toUpperCase()}
    </div>
  );
};

export default WorkspaceIcon;
