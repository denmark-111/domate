const ColorPicker = ({ colors, selectedColor, onChange }) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-8 h-8 rounded-md border-2 transition-all ${
            selectedColor === color
              ? 'border-white scale-110 ring-2 ring-accent'
              : 'border-transparent hover:scale-110'
          }`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
};

export default ColorPicker;
