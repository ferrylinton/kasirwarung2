import crypto from 'crypto';
import { storeCaptcha, consumeCaptcha } from '../config/redis.ts';

// Uppercase letters (A-Z) and numbers (2-9), excluding easily confused 0/O, 1/I
// Ensures distinct readability while fulfilling "huruf besar dan angka"
const CAPTCHA_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CAPTCHA_LENGTH = 5;
export const CAPTCHA_TTL_SECONDS = 300; // 5 minutes

/**
 * Generate a random uppercase alphanumeric string
 */
export function generateRandomCaptchaCode(length = CAPTCHA_LENGTH): string {
  let code = '';
  // Ensure at least one uppercase letter and at least one number
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  
  // First two positions ensure mixed letter and number
  code += letters[Math.floor(Math.random() * letters.length)];
  code += numbers[Math.floor(Math.random() * numbers.length)];

  for (let i = 2; i < length; i++) {
    const idx = Math.floor(Math.random() * CAPTCHA_CHARSET.length);
    code += CAPTCHA_CHARSET[idx];
  }

  // Shuffle characters
  return code
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Generate clean, beautiful SVG with security noise, curved lines, and rotated glyphs
 */
export function renderCaptchaSvg(code: string): string {
  const width = 170;
  const height = 48;

  // Background gradient or subtle grid
  let noiseLines = '';
  const lineColors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#64748b'];

  for (let i = 0; i < 4; i++) {
    const x1 = Math.floor(Math.random() * 20);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(width - Math.random() * 20);
    const y2 = Math.floor(Math.random() * height);
    const cx1 = Math.floor(width * 0.3 + Math.random() * 30);
    const cy1 = Math.floor(Math.random() * height);
    const cx2 = Math.floor(width * 0.7 + Math.random() * 30);
    const cy2 = Math.floor(Math.random() * height);
    const strokeColor = lineColors[i % lineColors.length];
    const opacity = (Math.random() * 0.35 + 0.3).toFixed(2);
    noiseLines += `<path d="M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}" stroke="${strokeColor}" stroke-opacity="${opacity}" stroke-width="2" fill="none" stroke-linecap="round" />`;
  }

  // Noise dots
  let noiseDots = '';
  for (let i = 0; i < 30; i++) {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    const r = (Math.random() * 1.5 + 0.8).toFixed(1);
    const opacity = (Math.random() * 0.45 + 0.2).toFixed(2);
    noiseDots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#64748b" fill-opacity="${opacity}" />`;
  }

  // Character glyphs with random rotations, slight vertical offsets, and color variation
  let textElements = '';
  const charSpacing = (width - 24) / code.length;
  const textColors = ['#0f172a', '#c2410c', '#1e3a8a', '#047857', '#6b21a8', '#334155'];

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const x = Math.floor(18 + i * charSpacing + (Math.random() * 4 - 2));
    const y = Math.floor(height / 2 + 8 + (Math.random() * 6 - 3));
    const rotate = Math.floor(Math.random() * 28 - 14);
    const color = textColors[i % textColors.length];
    const fontSize = Math.floor(24 + Math.random() * 4);

    textElements += `
      <g transform="rotate(${rotate} ${x} ${y})">
        <text
          x="${x}"
          y="${y}"
          font-family="system-ui, -apple-system, 'SF Pro Display', 'Segoe UI', Roboto, 'Courier New', monospace"
          font-size="${fontSize}px"
          font-weight="900"
          fill="${color}"
          letter-spacing="3"
          style="user-select: none;"
        >${char}</text>
      </g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="CAPTCHA Image" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; border: 1px solid #e2e8f0; display: block; overflow: hidden;">
    <rect width="100%" height="100%" fill="none" />
    ${noiseLines}
    ${noiseDots}
    ${textElements}
  </svg>`;
}

/**
 * Create a new CAPTCHA challenge and store it in Redis / memory
 */
export async function createCaptcha(): Promise<{
  captchaId: string;
  imageSvg: string;
  expiresInSeconds: number;
}> {
  const captchaId = crypto.randomUUID();
  const code = generateRandomCaptchaCode(5);
  await storeCaptcha(captchaId, code, CAPTCHA_TTL_SECONDS);
  const imageSvg = renderCaptchaSvg(code);

  return {
    captchaId,
    imageSvg,
    expiresInSeconds: CAPTCHA_TTL_SECONDS,
  };
}

/**
 * Verify and consume a CAPTCHA challenge
 * Case-insensitive match against uppercase code
 */
export async function verifyAndConsumeCaptcha(
  captchaId?: string,
  inputCode?: string,
  isEnglish = false
): Promise<{ valid: boolean; message?: string }> {
  if (!captchaId || !inputCode || !inputCode.trim()) {
    return {
      valid: false,
      message: isEnglish
        ? 'CAPTCHA verification code is required.'
        : 'Kode captcha wajib diisi.',
    };
  }

  const storedCode = await consumeCaptcha(captchaId);
  if (!storedCode) {
    return {
      valid: false,
      message: isEnglish
        ? 'CAPTCHA code has expired (5-minute validity) or is invalid. Please reload the captcha.'
        : 'Kode captcha telah kedaluwarsa (masa aktif 5 menit) atau tidak valid. Silakan muat ulang captcha.',
    };
  }

  const normalizedInput = inputCode.trim().toUpperCase();
  const normalizedStored = storedCode.trim().toUpperCase();

  if (normalizedInput !== normalizedStored) {
    return {
      valid: false,
      message: isEnglish
        ? 'Incorrect CAPTCHA code. Please check and try again.'
        : 'Kode captcha yang Anda masukkan salah. Silakan coba lagi.',
    };
  }

  return { valid: true };
}
