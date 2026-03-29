/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Info, ChevronRight, Pause, Play, ExternalLink, Github, Linkedin } from 'lucide-react';

// --- Types ---

type Point = { r: number; c: number };

type ShapeType = string;

interface ShapeInstance {
  id: string;
  type: ShapeType;
  cells: Point[];
  color: string;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

type Difficulty = 'EASY' | 'HARD';

const TETROMINOS: Record<string, Point[][]> = {
  I: [
    [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }],
    [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 3, c: 0 }],
  ],
  O: [
    [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
  ],
  T: [
    [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 1 }],
    [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }],
    [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 1, c: 1 }],
    [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 1 }],
  ],
  S: [
    [{ r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
    [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 1 }],
  ],
  Z: [
    [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }, { r: 1, c: 2 }],
    [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 0 }],
  ],
  J: [
    [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }],
    [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 2, c: 0 }],
    [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 2 }],
    [{ r: 0, c: 1 }, { r: 1, c: 1 }, { r: 2, c: 0 }, { r: 2, c: 1 }],
  ],
  L: [
    [{ r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }],
    [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 2, c: 1 }],
    [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }],
    [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }, { r: 2, c: 1 }],
  ],
};

const PENTOMINOS: Record<string, Point[][]> = {
  ...TETROMINOS,
  F: [
    [{ r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 1 }],
    [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 2 }],
  ],
  X: [
    [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 1 }],
  ],
  W: [
    [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }],
    [{ r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 0 }],
  ],
  U: [
    [{ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }], // U-up (safe)
    [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 2 }], // U-down (safe)
  ],
  V: [
    [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 }],
    [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 2, c: 0 }],
  ],
};

const COLORS = [
  '#FF5F5F', // Red
  '#5FFF5F', // Green
  '#5F5FFF', // Blue
  '#FFFF5F', // Yellow
  '#FF5FFF', // Magenta
  '#5FFFFF', // Cyan
  '#FF9F5F', // Orange
];

interface DifficultyConfig {
  rows: number;
  cols: number;
  shapes: Record<string, Point[][]>;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  EASY: { rows: 10, cols: 7, shapes: TETROMINOS },
  HARD: { rows: 12, cols: 9, shapes: PENTOMINOS },
};

// --- Utilities ---

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// --- Game Logic ---

export default function App() {
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [shapes, setShapes] = useState<Record<string, ShapeInstance>>({});
  const [removedCount, setRemovedCount] = useState(0);
  const [totalShapes, setTotalShapes] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generationId, setGenerationId] = useState(0);
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [isPaused, setIsPaused] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [combo, setCombo] = useState(0);
  const [lastRemovalTime, setLastRemovalTime] = useState(0);
  const [comboProgress, setComboProgress] = useState(0);
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);
  const [highScore, setHighScore] = useState<number>(0);

  const COMBO_TIMEOUT = 1500; // 1.5 seconds to keep combo (faster)
  const config = DIFFICULTY_CONFIG[difficulty];

  const [cellSize, setCellSize] = useState(48);

  // Load high score on mount
  useEffect(() => {
    const saved = localStorage.getItem('revertis-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Update high score when score changes
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('revertis-highscore', score.toString());
    }
  }, [score, highScore]);

  const updateCellSize = useCallback(() => {
    const width = window.innerWidth;
    const padding = 64; // Increased padding for safer mobile fit
    const availableWidth = width - padding;
    const maxCols = config.cols;
    const calculatedSize = Math.min(48, Math.floor(availableWidth / maxCols));
    setCellSize(calculatedSize);
  }, [config.cols]);

  useEffect(() => {
    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, [updateCellSize]);

  const generateBoard = useCallback(() => {
    setLoading(true);
    // Use a small delay to ensure the loading screen is visible and state resets properly
    setTimeout(() => {
      const { rows, cols, shapes: shapeSet } = DIFFICULTY_CONFIG[difficulty];
      const newGrid: (string | null)[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
      const newShapes: Record<string, ShapeInstance> = {};
      let shapeIdCounter = 0;
      const genId = Date.now();

      const getNeighboringColors = (cells: Point[]): string[] => {
        const neighborColors = new Set<string>();
        for (const cell of cells) {
          const adj = [
            { r: cell.r - 1, c: cell.c },
            { r: cell.r + 1, c: cell.c },
            { r: cell.r, c: cell.c - 1 },
            { r: cell.r, c: cell.c + 1 },
          ];
          for (const a of adj) {
            if (a.r >= 0 && a.r < rows && a.c >= 0 && a.c < cols) {
              const neighborId = newGrid[a.r][a.c];
              if (neighborId && newShapes[neighborId]) {
                neighborColors.add(newShapes[neighborId].color);
              }
            }
          }
        }
        return Array.from(neighborColors);
      };

      const fill = (r: number, c: number): boolean => {
        if (r === rows) return true;
        const nextC = (c + 1) % cols;
        const nextR = nextC === 0 ? r + 1 : r;

        if (newGrid[r][c] !== null) return fill(nextR, nextC);

        const types = shuffleArray(Object.keys(shapeSet));
        for (const type of types) {
          const rotations = shuffleArray(shapeSet[type] as Point[][]);
          for (const rotation of rotations) {
            const cells: Point[] = rotation.map(p => ({ r: r + p.r, c: c + p.c }));
            
            // Check if it fits
            const fits = cells.every(p => 
              p.r >= 0 && p.r < rows && 
              p.c >= 0 && p.c < cols && 
              newGrid[p.r][p.c] === null
            );

            if (fits) {
              const id = `shape-${genId}-${shapeIdCounter++}`;
              
              // Find a color that doesn't match neighbors
              const neighborColors = getNeighboringColors(cells);
              const availableColors = COLORS.filter(color => !neighborColors.includes(color));
              const chosenColor = availableColors.length > 0 ? getRandomElement(availableColors) : getRandomElement(COLORS);

              cells.forEach(p => newGrid[p.r][p.c] = id);
              newShapes[id] = {
                id,
                type,
                cells,
                color: chosenColor,
              };

              if (fill(nextR, nextC)) return true;

              // Backtrack
              cells.forEach(p => newGrid[p.r][p.c] = null);
              delete newShapes[id];
              shapeIdCounter--;
            }
          }
        }
        return false;
      };

      const isSolvable = (grid: (string | null)[][], shapes: Record<string, ShapeInstance>): boolean => {
        const currentGrid = grid.map(row => [...row]);
        const currentShapes = { ...shapes };
        let changed = true;

        while (changed) {
          changed = false;
          const ids = Object.keys(currentShapes);
          for (const id of ids) {
            const shape = currentShapes[id];
            let blocked = false;
            for (const cell of shape.cells) {
              let currR = cell.r - 1;
              while (currR >= 0) {
                const occupant = currentGrid[currR][cell.c];
                if (occupant !== null && occupant !== id) {
                  blocked = true;
                  break;
                }
                currR--;
              }
              if (blocked) break;
            }

            if (!blocked) {
              for (const cell of shape.cells) {
                currentGrid[cell.r][cell.c] = null;
              }
              delete currentShapes[id];
              changed = true;
              break;
            }
          }
        }
        return Object.keys(currentShapes).length === 0;
      };

      let attempts = 0;
      const MAX_ATTEMPTS = 50;
      let success = false;

      while (attempts < MAX_ATTEMPTS) {
        // Reset grid and shapes for each attempt
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) newGrid[r][c] = null;
        for (const key in newShapes) delete newShapes[key];
        shapeIdCounter = 0;

        if (fill(0, 0)) {
          if (isSolvable(newGrid, newShapes)) {
            success = true;
            break;
          }
        }
        attempts++;
      }

      if (success) {
        setGrid(newGrid);
        setShapes(newShapes);
        setTotalShapes(Object.keys(newShapes).length);
        setRemovedCount(0);
        setScore(0);
        setTimer(0);
        setCombo(0);
        setComboProgress(0);
        setLastRemovalTime(0);
        setIsWon(false);
        setGenerationId(genId);
      } else {
        console.error("Failed to generate solvable board after multiple attempts");
        // Fallback to the last generated board even if not fully solvable, 
        // or we could show an error. But simulation usually finds one quickly.
        setGrid(newGrid);
        setShapes(newShapes);
      }
      setLoading(false);
    }, 100);
  }, [difficulty]);

  useEffect(() => {
    generateBoard();
  }, [generateBoard]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!loading && !isWon && !isPaused) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading, isWon, isPaused]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!loading && !isWon && !isPaused && combo > 0) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastRemovalTime;
        const progress = Math.max(0, 1 - elapsed / COMBO_TIMEOUT);
        setComboProgress(progress);
        
        if (progress === 0) {
          setCombo(0);
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [loading, isWon, isPaused, combo, lastRemovalTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canFloatUp = (shapeId: string): boolean => {
    const shape = shapes[shapeId];
    if (!shape) return false;

    const dir = { r: -1, c: 0 };
    let blocked = false;

    for (const cell of shape.cells) {
      let currR = cell.r + dir.r;
      let currC = cell.c + dir.c;

      while (currR >= 0) {
        const occupant = grid[currR][currC];
        if (occupant !== null && occupant !== shapeId) {
          blocked = true;
          break;
        }
        currR += dir.r;
      }
      if (blocked) break;
    }

    return !blocked;
  };

  const handleShapeClick = (shapeId: string) => {
    if (isWon || loading || isPaused) return;
    if (canFloatUp(shapeId)) {
      const shape = shapes[shapeId];
      const now = Date.now();
      
      // Update combo
      let newCombo = 1;
      if (now - lastRemovalTime < COMBO_TIMEOUT) {
        newCombo = combo + 1;
      }
      setCombo(newCombo);
      setLastRemovalTime(now);
      setComboProgress(1);

      // Create particles
      const newParticles: Particle[] = [];
      shape.cells.forEach(cell => {
        for (let i = 0; i < 3; i++) {
          newParticles.push({
            id: `p-${Date.now()}-${Math.random()}`,
            x: cell.c * cellSize + (cellSize / 2) + (Math.random() - 0.5) * (cellSize / 2),
            y: cell.r * cellSize + (cellSize / 2) + (Math.random() - 0.5) * (cellSize / 2),
            color: shape.color,
            size: Math.random() * (cellSize / 8) + 2
          });
        }
      });
      setParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 1500);

      const newGrid = grid.map(row => row.map(cell => cell === shapeId ? null : cell));
      setGrid(newGrid);
      
      const newShapes = { ...shapes };
      delete newShapes[shapeId];
      setShapes(newShapes);
      setHoveredShapeId(null);
      
      setRemovedCount(prev => prev + 1);
      
      // Score with multiplier
      const multiplier = Math.floor(newCombo / 2) + 1;
      setScore(prev => prev + (100 * multiplier));

      if (Object.keys(newShapes).length === 0) {
        setIsWon(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <RefreshCw className="w-12 h-12 animate-spin text-blue-500" />
            <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-bold tracking-[0.3em] uppercase text-blue-400">Initializing Grid</p>
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Header */}
      <header className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0A0A0A]/80">
        <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white flex items-center gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5 text-white relative z-10">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
            REVERTIS
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="hidden xs:block text-[9px] md:text-[10px] opacity-40 uppercase tracking-[0.2em]">Reverse Gravity Puzzle</p>
            <div className="flex bg-white/5 rounded-md p-1 border border-white/5">
              {(['EASY', 'HARD'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    setIsPaused(false);
                  }}
                  className={`px-4 py-2 text-[11px] md:text-[12px] font-bold rounded transition-all ${difficulty === d ? 'bg-blue-600 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-8 w-full sm:w-auto">
          <div className="flex items-baseline gap-3 md:gap-8 pb-1">
            {combo > 1 && (
              <div className="flex flex-col items-end relative min-w-[40px]">
                <span className="text-[8px] md:text-[9px] uppercase tracking-widest opacity-30 text-yellow-500">Combo</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg md:text-xl font-mono font-black text-yellow-500">x{Math.floor(combo / 2) + 1}</span>
                  <span className="text-[9px] md:text-[10px] opacity-40">({combo})</span>
                </div>
                <div className="absolute -bottom-1 right-0 w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-yellow-500"
                    initial={{ width: '100%' }}
                    animate={{ width: `${comboProgress * 100}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col items-end">
              <span className="text-[7px] md:text-[9px] uppercase tracking-widest opacity-30">Time</span>
              <span className="text-base md:text-xl font-mono font-black text-white leading-none">{formatTime(timer)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[7px] md:text-[9px] uppercase tracking-widest opacity-30">Score</span>
              <span className="text-base md:text-xl font-mono font-black text-yellow-500 leading-none">{score.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-[7px] md:text-[9px] uppercase tracking-widest opacity-30 text-blue-400">Best</span>
              <span className="text-base md:text-xl font-mono font-black text-blue-400 leading-none">{highScore.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[7px] md:text-[9px] uppercase tracking-widest opacity-30">Cleared</span>
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-lg md:text-2xl font-mono font-black text-blue-500">{removedCount}</span>
                <span className="text-[9px] md:text-xs opacity-20">/ {totalShapes}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="p-3 md:p-4 hover:bg-white/5 rounded-xl transition-all active:scale-90 group border border-white/5"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play className="w-5 h-5 text-green-400" /> : <Pause className="w-5 h-5 text-yellow-400" />}
            </button>
            <button 
              onClick={generateBoard}
              className="p-3 md:p-4 hover:bg-white/5 rounded-xl transition-all active:scale-90 group border border-white/5"
              title="Regenerate Puzzle"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700 text-blue-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col xl:flex-row gap-8 md:gap-16 items-center justify-center min-h-[calc(100vh-100px)]">
        {/* Mobile Progress Bar (Visible only on smaller screens) */}
        <div className="w-full xl:hidden flex flex-col gap-2 px-4 mb-2">
          <div className="flex justify-between text-[10px] uppercase tracking-[0.3em] font-bold">
            <span className="text-blue-500">Purification Status</span>
            <span className="opacity-40">{Math.round((removedCount / totalShapes) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(removedCount / totalShapes) * 100}%` }}
              transition={{ type: 'spring', bounce: 0 }}
            />
          </div>
        </div>

        {/* Game Board Container */}
        <div className="relative p-2 md:p-3 bg-[#111111] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
          {/* Particles Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
            <AnimatePresence>
              {particles.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
                  animate={{ 
                    y: p.y - 800, 
                    x: p.x + (Math.random() - 0.5) * 100,
                    opacity: 0, 
                    scale: 0,
                    rotate: Math.random() * 360
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute rounded-sm"
                  style={{ 
                    width: p.size, 
                    height: p.size, 
                    backgroundColor: p.color,
                    boxShadow: `0 0 10px ${p.color}`
                  }}
                />
              ))}
            </AnimatePresence>
          </div>

          <div 
            className="grid gap-1 md:gap-1.5"
            style={{ 
              gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${config.rows}, ${cellSize}px)`
            }}
          >
            {grid.map((row, r) => 
              row.map((shapeId, c) => {
                const shape = shapeId ? shapes[shapeId] : null;
                const removable = shapeId ? canFloatUp(shapeId) : false;
                const isHovered = shapeId && shapeId === hoveredShapeId;
                
                return (
                  <div 
                    key={`${generationId}-${r}-${c}`}
                    className="relative"
                    style={{ width: cellSize, height: cellSize }}
                  >
                    <AnimatePresence mode="popLayout">
                      {shape && (
                        <motion.button
                          key={`${shapeId}-${r}-${c}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ 
                            scale: isHovered ? 1.05 : 1, 
                            opacity: 1,
                            filter: isHovered ? 'brightness(1.2)' : 'brightness(1)'
                          }}
                          exit={{ 
                            y: -1200, 
                            opacity: 0, 
                            scale: 1.1,
                            rotate: getRandomElement([-45, 45, -30, 30]),
                            transition: { 
                              duration: 1.2, 
                              ease: [0.25, 1, 0.5, 1], // Fast start, smooth finish
                            }
                          }}
                          onMouseEnter={() => setHoveredShapeId(shapeId)}
                          onMouseLeave={() => setHoveredShapeId(null)}
                          onClick={() => handleShapeClick(shapeId)}
                          className={`
                            absolute inset-0 rounded-md transition-all duration-300
                            ring-1 ring-black/20 ring-inset
                            ${removable ? 'cursor-pointer z-20' : 'cursor-not-allowed opacity-90'}
                            ${isHovered ? 'z-30' : ''}
                          `}
                          style={{ 
                            backgroundColor: shape.color,
                            boxShadow: isHovered 
                              ? `0 0 30px ${shape.color}${removable ? '88' : '44'}` 
                              : (removable ? `0 0 15px ${shape.color}22` : 'none'),
                            border: isHovered ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(0,0,0,0.25)'
                          }}
                        >
                          {/* Bevel and Texture */}
                          <div className="absolute inset-0 border-t-2 border-l-2 border-white/20 rounded-md" />
                          <div className="absolute inset-0 border-b-2 border-r-2 border-black/30 rounded-md" />
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                          
                          {/* Highlight for removable shapes */}
                          {removable && (
                            <motion.div 
                              className="absolute inset-0 bg-white/20"
                              animate={{ opacity: [0.1, 0.3, 0.1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            />
                          )}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          {/* Win Overlay */}
          <AnimatePresence>
            {isPaused && !isWon && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-center p-10"
              >
                <div className="flex flex-col items-center gap-4">
                  <Pause className="w-16 h-16 text-yellow-500 animate-pulse" />
                  <h2 className="text-3xl font-black tracking-tighter text-white">PAUSED</h2>
                  <button 
                    onClick={() => setIsPaused(false)}
                    className="mt-4 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border border-white/10"
                  >
                    <Play className="w-4 h-4" /> RESUME
                  </button>
                </div>
              </motion.div>
            )}

            {isWon && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center text-center p-10 border border-blue-500/20"
              >
                <motion.div
                  initial={{ y: 40, scale: 0.8, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
                  <div className="relative mb-6">
                    <Trophy className="w-20 h-20 text-yellow-500 mx-auto" />
                    <motion.div 
                      className="absolute inset-0 bg-yellow-500/20 blur-3xl -z-10"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    />
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter mb-3 text-white">GRID PURIFIED</h2>
                  <div className="flex flex-col gap-1 mb-8">
                    <p className="text-xs opacity-50 uppercase tracking-widest">Final Score: <span className="text-yellow-500 font-bold">{score.toLocaleString()}</span></p>
                    {score >= highScore && score > 0 && (
                      <motion.p 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mb-1"
                      >
                        New High Score!
                      </motion.p>
                    )}
                    <p className="text-xs opacity-50 uppercase tracking-widest">Best: <span className="text-blue-400 font-bold">{highScore.toLocaleString()}</span></p>
                    <p className="text-xs opacity-50 uppercase tracking-widest">Time: <span className="text-white font-bold">{formatTime(timer)}</span></p>
                  </div>
                  <p className="text-[10px] opacity-30 mb-10 max-w-[240px] mx-auto uppercase tracking-widest leading-relaxed">
                    All blocks have returned to the void.
                  </p>
                  <button 
                    onClick={generateBoard}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-black transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto shadow-[0_0_30px_rgba(37,99,235,0.4)]"
                  >
                    NEW CHALLENGE <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instructions / Sidebar */}
        <div className="flex flex-col gap-8 max-w-sm w-full">
          <section className="bg-white/[0.03] p-6 md:p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -z-10" />
            <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3 text-blue-500">
              <Info className="w-4 h-4" /> How to Play
            </h3>
            <ul className="space-y-4 md:space-y-6 text-[10px] md:text-xs opacity-60 leading-relaxed uppercase tracking-widest">
              <li className="flex gap-4">
                <span className="text-blue-500 font-mono font-bold">01</span>
                <span>Click on a shape to <span className="text-white">extract</span> it from the grid.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-blue-500 font-mono font-bold">02</span>
                <span>Shapes can only be removed if their <span className="text-white">upward path</span> is completely clear.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-blue-500 font-mono font-bold">03</span>
                <span>Plan your moves carefully to <span className="text-white">unblock</span> shapes trapped below.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-blue-500 font-mono font-bold">04</span>
                <span>Maintain your <span className="text-white">combo meter</span> by extracting shapes in rapid succession.</span>
              </li>
            </ul>
          </section>

          {/* Desktop Progress Bar (Visible only on larger screens) */}
          <div className="hidden xl:flex flex-col gap-4 px-4">
            <div className="flex justify-between text-[9px] uppercase tracking-[0.3em] font-bold">
              <span className="text-blue-500">Purification Status</span>
              <span className="opacity-40">{Math.round((removedCount / totalShapes) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(removedCount / totalShapes) * 100}%` }}
                transition={{ type: 'spring', bounce: 0 }}
              />
            </div>
          </div>
        </div>
      </main>


      {/* Footer */}
      <footer className="p-12 text-center flex flex-col items-center gap-6">
        <div className="opacity-20 text-[9px] uppercase tracking-[0.4em] font-bold">
          &copy; 2026 REVERTIS
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-500/60">Created by Elshad Guliyev</p>
          <div className="flex items-center gap-4">
            <a 
              href="https://www.linkedin.com/in/elshad-guliyev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-white/5 hover:bg-blue-500/10 rounded-lg border border-white/5 hover:border-blue-500/20 transition-all group"
              title="LinkedIn Profile"
            >
              <Linkedin className="w-4 h-4 text-white/40 group-hover:text-blue-400 transition-colors" />
            </a>
            <a 
              href="https://github.com/ell-shad/Revertis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 hover:border-white/20 transition-all group"
              title="GitHub Repository"
            >
              <Github className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
