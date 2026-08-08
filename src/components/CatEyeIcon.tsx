interface CatEyeIconProps {
  open: boolean;
  className?: string;
}

export function CatEyeIcon({ open, className }: CatEyeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Cat head outline */}
      <path d="M12 19c3.5 0 6-2.5 6-6V9c0-1-2-2-3-2.5L13 3.5c-.5-.2-1.5-.2-2 0L7 6.5C6 7 4 8 4 9v4c0 3.5 2.5 6 6 6z" />
      {/* Left ear */}
      <path d="M7 6.5l-1.5-2.5c-.5-1-.2-1.5.5-1.5h2.5L8.5 5.5" />
      {/* Right ear */}
      <path d="M17 6.5l1.5-2.5c.5-1 .2-1.5-.5-1.5h-2.5L15.5 5.5" />
      {open ? (
        <>
          {/* Open eyes - pupils */}
          <circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </>
      ) : (
        <>
          {/* Closed eyes - sleeping lines */}
          <path d="M7.5 12.5c.5-.5 1.5-.5 2 0" />
          <path d="M13.5 12.5c.5-.5 1.5-.5 2 0" />
        </>
      )}
      {/* Nose */}
      <path d="M11 14.5l1 .8 1-.8" />
      {/* Whiskers */}
      <path d="M3.5 12.5l2 1M3.5 15l2-.5" />
      <path d="M20.5 12.5l-2 1M20.5 15l-2-.5" />
    </svg>
  );
}
