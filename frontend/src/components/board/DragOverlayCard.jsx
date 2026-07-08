const DragOverlayCard = ({ task }) => {
  const isCompleted = !!task.completedAt;

  return (
    <div className="bg-bg p-3 rounded-lg border border-border shadow-xl w-80">
      <p className={`text-xs font-medium ${isCompleted ? 'text-text-secondary line-through' : 'text-text'}`}>
        {task.name || task.title}
      </p>
      {task.labels?.length > 0 && (
        <div className="flex gap-1 mt-2">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: label.color }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DragOverlayCard;
