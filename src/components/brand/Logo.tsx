import Image from "next/image";

type LogoProps = {
  /** Altura aproximada em px. A largura escala proporcionalmente. */
  size?: number;
  className?: string;
};

const ASPECT_RATIO = 615 / 247;

/**
 * Wordmark oficial "Lumii" (docs/brand/Lumii - Marca.pdf), em gradiente
 * verde → amarelo → coral, fundo transparente. Funciona sobre fundo claro
 * ou sobre navy.
 */
export default function Logo({ size = 28, className }: LogoProps) {
  const height = size;
  const width = Math.round(size * ASPECT_RATIO);

  return (
    <Image
      src="/logo-lumii.png"
      alt="Lumii"
      width={width}
      height={height}
      unoptimized
      priority
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
