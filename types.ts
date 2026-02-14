
export enum AgentId {
  RIYU = 'riyu',
  CYBER_RED = 'cyber-red',
  CYBER_BLUE = 'cyber-blue',
  CODE_MASTER = 'code-master',
  AUTO_SYS = 'auto-sys'
}

export interface AvatarConfig {
  hair: string;
  outfit: string;
  accessory: string;
}

export interface UserStats {
  level: number;
  xp: number;
  unlockedItems: string[];
}

export interface Agent {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  systemInstruction: string;
  icon: string;
  color: string;
}

export interface User {
  username: string;
  role: 'admin' | 'user';
  email: string;
  stats: UserStats;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}
