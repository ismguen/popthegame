export interface GameState {
    score: number;
    dropsLeft: number;
    progress: {
        unlockedLevels: number;
        stars: Record<number, number>;
        totalCoins: number;
    };
    activeSkill: string | null;
    comboCount: number;
    level: number;
    transitioning: boolean;
    slowMoFactor: number;
}

export const state: GameState = {
    score: 0,
    dropsLeft: 10,
    progress: {
        unlockedLevels: 1,
        stars: {},
        totalCoins: 0
    },
    activeSkill: null,
    comboCount: 0,
    level: 1,
    transitioning: false,
    slowMoFactor: 1.0
};

export function loadProgress() {
    const saved = localStorage.getItem('dewDropProgress');
    if (saved) {
        state.progress = JSON.parse(saved);
    }
}

export function saveProgress() {
    localStorage.setItem('dewDropProgress', JSON.stringify(state.progress));
}
