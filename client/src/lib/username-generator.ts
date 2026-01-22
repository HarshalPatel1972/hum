// Creative username generator for HUM
const COLORS = [
  'ruby', 'jade', 'amber', 'azure', 'violet', 'coral', 'indigo', 'crimson',
  'emerald', 'sapphire', 'topaz', 'pearl', 'onyx', 'silver', 'golden', 'bronze'
];

const ADJECTIVES = [
  'vibrant', 'mystic', 'cosmic', 'neon', 'velvet', 'crystal', 'ethereal', 'radiant',
  'silent', 'blazing', 'frozen', 'electric', 'lunar', 'solar', 'stellar', 'astral'
];

const NOUNS = [
  'wave', 'dream', 'echo', 'pulse', 'vibe', 'rhythm', 'star', 'moon',
  'flame', 'storm', 'breeze', 'spark', 'glow', 'shadow', 'light', 'mist'
];

export function generateUsername(): string {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  
  return `${color}-${adjective}-${noun}`;
}

// Get or create username for this session
export function getSessionUsername(): string {
  if (typeof window === 'undefined') return 'cosmic-wave';
  
  const stored = sessionStorage.getItem('hum-username');
  if (stored) return stored;
  
  const newUsername = generateUsername();
  sessionStorage.setItem('hum-username', newUsername);
  return newUsername;
}
