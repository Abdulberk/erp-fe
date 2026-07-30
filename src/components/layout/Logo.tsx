import Image from "next/image";

/** Kaynak dosyanın gerçek boyutu — `next/image` oranı buradan koruyor. */
const INTRINSIC = { width: 1609, height: 390 };

interface Props {
  /** Yüksekliği belirleyen sınıf; genişlik oranla hesaplanır. */
  className?: string;
  alt?: string;
  priority?: boolean;
}

/**
 * Sonart kurumsal logosu.
 *
 * Logo iki renkli: teal (#0098a0) ve koyu (#202020). Koyu yarı, dark modun
 * yüzeyinde kayboluyor. Filtreyle çevirmek marka rengini bozacağı için
 * bunun yerine dark modda altına açık bir levha konuyor (`--logo-plate`);
 * light modda levha saydam, logo doğrudan yüzeye oturuyor.
 */
export function Logo({ className = "h-8", alt = "Sonart", priority = false }: Props) {
  return (
    <span
      className="inline-flex items-center rounded-md"
      style={{ background: "var(--logo-plate)", padding: "var(--logo-plate-pad)" }}
    >
      <Image
        src="/header/logo.png"
        alt={alt}
        width={INTRINSIC.width}
        height={INTRINSIC.height}
        priority={priority}
        className={`${className} w-auto`}
      />
    </span>
  );
}
