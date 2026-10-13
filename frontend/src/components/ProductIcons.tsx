import React from 'react';

interface IconProps {
  type: string;
  className?: string;
  color?: string;
}

export const ProductIcon: React.FC<IconProps> = ({ type, className = 'w-12 h-12', color }) => {
  switch (type) {
    case 'noodle':
      // Indomie: Bowl of noodles with steam & chopsticks
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className}>
          <path
            d="M12 28C12 42 20.9 50 32 50C43.1 50 52 42 52 28H12Z"
            fill={color || '#F59E0B'}
          />
          <path
            d="M24 50L20 54H44L40 50"
            stroke={color || '#F59E0B'}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Noodles top surface */}
          <path
            d="M10 28C10 24 16 22 22 24C28 26 36 22 42 24C48 26 54 24 54 28"
            stroke="#D97706"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M14 24C16 19 23 18 28 21C34 23 40 19 46 22"
            stroke="#FBBF24"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Chopsticks */}
          <line x1="46" y1="12" x2="26" y2="30" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="52" y1="12" x2="30" y2="30" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'water':
      // Aqua: Mineral water bottle
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className}>
          <rect x="28" y="10" width="8" height="5" rx="1.5" fill="#0284C7" />
          <path
            d="M27 15C27 15 24 18 24 23V46C24 50 27 53 32 53C37 53 40 50 40 46V23C40 18 37 15 37 15H27Z"
            fill={color || '#0EA5E9'}
          />
          <rect x="23" y="27" width="18" height="12" rx="2" fill="#E0F2FE" />
          <path
            d="M26 33C29 31 35 35 38 33"
            stroke="#0284C7"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'milk':
      // Ultra Milk: Cow silhouette / milk carton
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className}>
          <path
            d="M20 22C20 22 24 14 32 14C40 14 44 22 44 22V48C44 51 41 53 38 53H26C23 53 20 51 20 48V22Z"
            fill="#FED7AA"
          />
          {/* Cow silhouette / spots */}
          <path
            d="M22 28C26 28 28 32 30 32C33 32 34 29 38 30C41 31 43 36 43 38C38 39 36 43 32 42C27 41 26 46 22 44V28Z"
            fill={color || '#9A3412'}
          />
          <circle cx="28" cy="24" r="2" fill="#9A3412" />
          <circle cx="36" cy="24" r="2" fill="#9A3412" />
          <path d="M26 19L22 15" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 19L42 15" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'oil':
      // Minyak Sania: Cooking oil bottle
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className}>
          <rect x="29" y="10" width="6" height="5" rx="1.5" fill="#A16207" />
          <path
            d="M28 15H36L38 22H26L28 15Z"
            fill={color || '#EAB308'}
          />
          <path
            d="M26 22C21 26 21 34 22 44C23 50 26 53 32 53C38 53 41 50 42 44C43 34 43 26 38 22H26Z"
            fill={color || '#CA8A04'}
          />
          <circle cx="32" cy="35" r="4" fill="#FEF08A" />
        </svg>
      );

    case 'chips':
      // Chitato: Potato chip with dots
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className}>
          <ellipse cx="32" cy="34" rx="18" ry="14" fill={color || '#EA580C'} />
          <circle cx="26" cy="30" r="1.8" fill="#FFF7ED" />
          <circle cx="34" cy="28" r="2.2" fill="#FFF7ED" />
          <circle cx="38" cy="35" r="1.8" fill="#FFF7ED" />
          <circle cx="29" cy="38" r="2" fill="#FFF7ED" />
          <circle cx="24" cy="36" r="1.4" fill="#FFF7ED" />
          <circle cx="35" cy="41" r="1.5" fill="#FFF7ED" />
        </svg>
      );

    case 'rice':
      // Beras: Rice/wheat stalk
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className}>
          <path d="M32 52V14" stroke={color || '#16A34A'} strokeWidth="2.5" strokeLinecap="round" />
          <path
            d="M32 18C36 14 42 16 42 20C42 24 36 24 32 24"
            fill={color || '#16A34A'}
          />
          <path
            d="M32 26C28 22 22 24 22 28C22 32 28 32 32 32"
            fill={color || '#16A34A'}
          />
          <path
            d="M32 34C36 30 42 32 42 36C42 40 36 40 32 40"
            fill={color || '#16A34A'}
          />
          <path
            d="M32 42C28 38 22 40 22 44C22 48 28 48 32 48"
            fill={color || '#16A34A'}
          />
        </svg>
      );

    case 'tea':
      // Teh Botol Sosro: Teacup and saucer
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className}>
          <path
            d="M20 28H44V38C44 44 38 48 32 48C26 48 20 44 20 38V28Z"
            fill={color || '#9A3412'}
          />
          <path
            d="M44 30H48C51 30 53 32 53 35C53 38 51 40 48 40H44"
            stroke={color || '#9A3412'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M16 52H48"
            stroke={color || '#9A3412'}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Steam */}
          <path
            d="M26 23C26 20 28 19 28 16"
            stroke="#EA580C"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M36 23C36 20 38 19 38 16"
            stroke="#EA580C"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'energy':
      // Pocari Sweat: Lightning bolt
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className}>
          <path
            d="M35 12L21 34H33L29 52L43 28H31L35 12Z"
            fill={color || '#2563EB'}
          />
        </svg>
      );

    default:
      // Fallback package box
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className}>
          <path
            d="M32 14L48 22V42L32 50L16 42V22L32 14Z"
            fill={color || '#F59E0B'}
            opacity="0.8"
          />
          <path
            d="M32 14V50M16 22L32 30L48 22"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
  }
};
