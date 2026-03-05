export function ColonyIcon({
  className,
  size,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="82 82 350 350"
      fill="currentColor"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      <rect x="228" y="97"  width="58" height="58" rx="12" />
      <rect x="294" y="97"  width="58" height="58" rx="12" />
      <rect x="162" y="163" width="58" height="58" rx="12" />
      <rect x="294" y="163" width="58" height="58" rx="12" />
      <rect x="360" y="163" width="58" height="58" rx="12" />
      <rect x="96"  y="229" width="58" height="58" rx="12" />
      <rect x="162" y="229" width="58" height="58" rx="12" />
      <rect x="228" y="229" width="58" height="58" rx="12" />
      <rect x="360" y="229" width="58" height="58" rx="12" />
      <rect x="96"  y="295" width="58" height="58" rx="12" />
      <rect x="228" y="295" width="58" height="58" rx="12" />
      <rect x="294" y="295" width="58" height="58" rx="12" />
      <rect x="162" y="361" width="58" height="58" rx="12" />
      <rect x="228" y="361" width="58" height="58" rx="12" />
    </svg>
  );
}
