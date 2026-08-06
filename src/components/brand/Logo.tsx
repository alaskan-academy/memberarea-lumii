type LogoProps = {
  /** Altura aproximada em px. A largura escala proporcionalmente. */
  size?: number;
  className?: string;
};

/**
 * Wordmark "Lumii" em gradiente (verde → amarelo → coral), conforme
 * docs/brand/IDV-Lumii.md. Funciona sobre fundo claro ou sobre navy.
 */
export default function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 140 40"
      height={size}
      width={(size * 140) / 40}
      className={className}
      role="img"
      aria-label="Lumii"
    >
      <defs>
        <linearGradient id="lumiiWordmarkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#71c69a" />
          <stop offset="55%" stopColor="#eebc3e" />
          <stop offset="100%" stopColor="#f6614f" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="30"
        fontFamily="Poppins, Arial, Helvetica, sans-serif"
        fontWeight={800}
        fontSize="34"
        letterSpacing="-0.5"
        fill="url(#lumiiWordmarkGradient)"
      >
        Lumii
      </text>
    </svg>
  );
}
