function Toast({
  message,
  type,
  onClose
}) {
  if (!message) return null;
  return (
    <div className={`fixed top-15 left-1/2 -translate-x-1/2 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3
      ${type == 'success' ? 'bg-emerald-600' : 'bg-red-600'}
    `}>
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="text-white hover:text-white cursor-pointer font-bold leading-none"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;