const DragOverlayCard = ({ task }) => {
  const isCompleted = !!task.completedAt;

  return (
    <div className="bg-surface-container-lowest p-3.5 rounded-DEFAULT border-2 border-primary shadow-2xl w-80">
      <p className={`font-body-md text-xs font-bold ${isCompleted ? 'text-secondary line-through' : 'text-on-surface'}`}>
        {task.name || task.title}
      </p>
      {task.labels?.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="px-1.5 py-0.5 font-mono-label text-[9px] font-bold uppercase rounded-DEFAULT text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DragOverlayCard;
