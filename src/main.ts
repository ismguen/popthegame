import './style.css';
import { startGame, showMap, initGame } from './core/Game';
import { loadProgress } from './core/State';

// Initialize the game
loadProgress();
initGame();
showMap();

// Expose global functions for HTML buttons (Temporary until UI is fully React/Componentized)
(window as any).startGame = startGame;
(window as any).showMap = showMap;
(window as any).openShop = () => {
    document.getElementById('map-screen')?.classList.remove('active');
    document.getElementById('shop-screen')?.classList.add('active');
};
(window as any).closeShop = () => {
    document.getElementById('shop-screen')?.classList.remove('active');
    document.getElementById('map-screen')?.classList.add('active');
};
