export default function ImageToolbar({
  onToggleRounded,
  isRounded,
  onToggleLockRatio,
  isLockRatio,
}: {
  onToggleRounded: () => void;
  isRounded: boolean;
  onToggleLockRatio: () => void;
  isLockRatio: boolean;
}) {
  return (
    <div
      className="absolute -top-12 left-1/2 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#27272a] z-[10]"
      style={{ transform: 'translateX(-50%)', width: 'max-content' }}
    >
      <button
        onClick={onToggleRounded}
        className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
          isRounded
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5'
        }`}
        title="Bo góc (Rounded Corners)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="4" />
        </svg>
      </button>
      <button
        onClick={onToggleLockRatio}
        className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
          isLockRatio
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5'
        }`}
        title={isLockRatio ? 'Mở khóa tỉ lệ' : 'Khóa tỉ lệ (Lock Aspect Ratio)'}
      >
        {isLockRatio ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
        )}
      </button>
      <div className="h-4 w-[1px] bg-zinc-200 dark:bg-white/10 mx-1" />
      <div className="flex items-center gap-1.5 px-2">
        <input
          type="checkbox"
          id="lock-ratio-checkbox"
          checked={isLockRatio}
          onChange={onToggleLockRatio}
          className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <label
          htmlFor="lock-ratio-checkbox"
          className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer select-none whitespace-nowrap"
        >
          Lock Ratio
        </label>
      </div>
    </div>
  );
}
