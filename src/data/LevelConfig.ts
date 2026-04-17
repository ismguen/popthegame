import levelsData from './levels.json';

export interface LevelConfig {
    id: number;
    name: string;
    features: {
        rocks: number;
        brambles: number;
        webs: number;
        ice: number;
        elements: string[];
    };
    boss?: {
        type: string;
        hp: number;
        width: number;
        height: number;
    };
    mapPos: { x: number; y: number };
}

export const LEVELS: LevelConfig[] = levelsData as LevelConfig[];

export function getLevelConfig(levelId: number): LevelConfig | undefined {
    return LEVELS.find(l => l.id === levelId);
}
