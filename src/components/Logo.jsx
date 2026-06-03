export function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke="var(--line-strong)" strokeWidth="1" strokeDasharray="3 2" />
      <path d="M12 2C12 2 12 5 12 7" stroke="var(--moderator)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 22V17" stroke="var(--moderator)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M2 12H7" stroke="var(--moderator)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 12H17" stroke="var(--moderator)" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1.5" fill="var(--academy)" stroke="var(--moderator)" strokeWidth="0.5" />
    </svg>
  );
}