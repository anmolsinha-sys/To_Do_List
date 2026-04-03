import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Flame,
  Trophy,
  LogOut,
  Circle,
  Zap,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as Tone from "tone";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Auth, type UserProfile } from "@/components/Auth";

// --- Types & Constants ---

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

const BADGES_CONFIG = [
  { id: "first_step", name: "First Step", description: "Complete your first task", icon: Circle, unlock: (count: number) => count >= 1 },
  { id: "beginner", name: "Beginner", description: "Complete 5 tasks", icon: Zap, unlock: (count: number) => count >= 5 },
  { id: "pro", name: "Pro", description: "Complete 20 tasks", icon: Trophy, unlock: (count: number) => count >= 20 },
  { id: "streak_king", name: "Streak King", description: "Maintain a 7-day streak", icon: Flame, unlock: (_: number, streak: number) => streak >= 7 },
];

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [isMuted] = useState(false);
  const [showMilestone, setShowMilestone] = useState<{ title: string; desc: string } | null>(null);

  const synth = useRef<Tone.Synth | null>(null);
  const strikePlayer = useRef<Tone.Player | null>(null);

  // --- Persistence Logic ---

  useEffect(() => {
    if (!user) return;
    const savedTodos = localStorage.getItem(`todos_${user.id}`);
    const savedStreak = localStorage.getItem(`streak_${user.id}`);
    const savedPoints = localStorage.getItem(`points_${user.id}`);
    const savedBadges = localStorage.getItem(`badges_${user.id}`);
    const lastCompletedDate = localStorage.getItem(`lastCompletedDate_${user.id}`);

    if (savedTodos) setTodos(JSON.parse(savedTodos));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedPoints) setPoints(parseInt(savedPoints));
    if (savedBadges) setUnlockedBadges(JSON.parse(savedBadges));

    // Streak Reset Logic
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastCompletedDate && lastCompletedDate !== today && lastCompletedDate !== yesterdayStr) {
      setStreak(0);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`todos_${user.id}`, JSON.stringify(todos));
  }, [todos, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`streak_${user.id}`, streak.toString());
  }, [streak, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`points_${user.id}`, points.toString());
  }, [points, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`badges_${user.id}`, JSON.stringify(unlockedBadges));
  }, [unlockedBadges, user]);

  useEffect(() => {
    // Initialize Tone.js
    synth.current = new Tone.Synth().toDestination();
    strikePlayer.current = new Tone.Player("/fahhhhh.mp3").toDestination();
    return () => {
      synth.current?.dispose();
      strikePlayer.current?.dispose();
    };
  }, []);

  // --- Helpers ---

  const playStrike = () => {
    if (isMuted || !strikePlayer.current) return;
    if (Tone.context.state !== "running") Tone.start();
    strikePlayer.current.start();
  };

  const playFanfare = () => {
    if (isMuted || !synth.current) return;
    const notes = ["C4", "E4", "G4", "C5"];
    notes.forEach((note, i) => {
      setTimeout(() => synth.current?.triggerAttackRelease(note, "8n"), i * 150);
    });
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f97316", "#fbbf24", "#ffffff"]
    });
  };

  const checkBadges = (completedCount: number, currentStreak: number) => {
    BADGES_CONFIG.forEach(badge => {
      if (!unlockedBadges.includes(badge.id)) {
        if (badge.unlock(completedCount, currentStreak)) {
          setUnlockedBadges(prev => [...prev, badge.id]);
          setShowMilestone({ title: "Badge Unlocked!", desc: `You've earned the "${badge.name}" badge!` });
          playFanfare();
          triggerConfetti();
        }
      }
    });
  };

  // --- Handlers ---

  const addTodo = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: inputValue,
      completed: false,
      createdAt: Date.now(),
    };

    setTodos([newTodo, ...todos]);
    setInputValue("");
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === id && !todo.completed) {
        // Just completed
        playStrike();
        triggerConfetti();

        // Update Streak & Points
        const today = new Date().toDateString();
        const multiplier = streak >= 7 ? 2 : 1;
        setPoints(p => p + (10 * multiplier));

        if (user) {
          localStorage.setItem(`lastCompletedDate_${user.id}`, today);
          if (streak === 0 || localStorage.getItem(`lastCompletedDate_${user.id}`) !== today) {
            setStreak(s => s + 1);
          }
        }

        // Check Milestones
        const completedCount = todos.filter(t => t.completed).length + 1;
        checkBadges(completedCount, streak);

        // Haptic
        if (window.navigator.vibrate) window.navigator.vibrate(50);

        return { ...todo, completed: true };
      }
      return todo;
    }));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  // --- Multiplier Logic ---
  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="dark min-h-screen bg-black text-white selection:bg-orange-500/30 selection:text-orange-500 pb-20 relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-600 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-pink-600 blur-[180px] rounded-full" />
      </div>

      {/* Premium Header */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5 bg-black/60 backdrop-blur-3xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="size-10 sm:size-12 rounded-xl sm:rounded-2xl baddest-gradient p-[1px] shadow-lg shadow-orange-500/20">
              <div className="w-full h-full bg-black rounded-[9px] sm:rounded-[15px] flex items-center justify-center font-black italic text-lg sm:text-xl">
                D
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter leading-none">DO IT <span className="text-orange-500">NOW</span></h1>
              <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Status: Operational</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <div className="flex items-center gap-2 sm:gap-3 bg-zinc-900/50 p-1 sm:p-1.5 pl-3 sm:pl-4 rounded-xl sm:rounded-2xl border border-white/5">
                <div className="text-right hidden min-[450px]:block">
                  <p className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase leading-none mb-1">Authenticated</p>
                  <p className="text-[10px] sm:text-xs font-bold text-white truncate max-w-[60px] sm:max-w-[100px]">{user.email.split('@')[0]}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUser(null)}
                  className="size-7 sm:size-8 rounded-lg sm:rounded-xl hover:bg-red-500/10 hover:text-red-500 text-zinc-500 transition-all"
                >
                  <LogOut size={14} className="sm:size-4" />
                </Button>
              </div>
            )}

            <Sheet>
              <SheetTrigger>
                <Button variant="ghost" size="icon" className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-800 transition-all group">
                  <Flame size={18} className="sm:size-5 group-hover:text-orange-500 transition-colors" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-black/95 border-l border-white/10 backdrop-blur-2xl w-full sm:max-w-md p-6 sm:p-8">
                <SheetHeader className="mb-8 sm:mb-10">
                  <SheetTitle className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white">ACHIEVEMENTS</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                  {BADGES_CONFIG.map((badge) => {
                    const isUnlocked = unlockedBadges.includes(badge.id);
                    const Icon = badge.icon;
                    return (
                      <motion.div
                        key={badge.id}
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        className={cn(
                          "p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all flex flex-col items-center text-center gap-3 sm:gap-4 relative overflow-hidden group",
                          isUnlocked
                            ? "bg-zinc-900/50 border-orange-500/30 shadow-[0_10px_30px_rgba(249,115,22,0.1)]"
                            : "bg-zinc-950/30 border-white/5 opacity-40 grayscale"
                        )}
                      >
                        {isUnlocked && (
                          <div className="absolute top-0 left-0 w-full h-1 baddest-gradient" />
                        )}
                        <div className={cn(
                          "p-3 sm:p-4 rounded-xl sm:rounded-2xl",
                          isUnlocked ? "bg-orange-500/10 text-orange-500" : "bg-zinc-800 text-zinc-600"
                        )}>
                          <Icon size={24} className="sm:size-8" />
                        </div>
                        <div>
                          <h3 className="font-black italic text-xs sm:text-sm tracking-tight mb-1">{badge.name}</h3>
                          <p className="text-[8px] sm:text-[10px] text-muted-foreground font-bold leading-tight">{badge.description}</p>
                        </div>
                        {!isUnlocked && (
                          <div className="pt-1 sm:pt-2">
                            <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-zinc-800 text-[6px] sm:text-[8px] font-black uppercase tracking-widest text-zinc-500">Locked</div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 space-y-8 sm:space-y-12 relative z-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="glass-card p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap size={60} className="sm:size-20 text-orange-500" />
            </div>
            <p className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-4">Current Streak</p>
            <div className="flex items-end gap-2 sm:gap-3">
              <span className="text-4xl sm:text-6xl font-black italic leading-none drop-shadow-xl">{streak}</span>
              <span className="text-orange-500 font-black italic mb-0.5 sm:mb-1 text-[10px] sm:text-sm">DAYS</span>
            </div>
            <div className="mt-4 sm:mt-6 flex items-center gap-2">
              <div className="h-1 sm:h-1.5 flex-1 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  className="h-full baddest-gradient"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((streak / 7) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[8px] sm:text-[10px] font-black text-zinc-600">{streak}/7</span>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Trophy size={60} className="sm:size-20 text-pink-500" />
            </div>
            <p className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-4">Total Points</p>
            <div className="flex items-end gap-2 sm:gap-3">
              <span className="text-4xl sm:text-6xl font-black italic leading-none drop-shadow-xl">{points}</span>
              <span className="text-pink-500 font-black italic mb-0.5 sm:mb-1 text-[10px] sm:text-sm">XP</span>
            </div>
            <div className="mt-4 sm:mt-6">
              <Badge className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-white/5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 font-bold text-[8px] sm:text-[9px] uppercase tracking-wider">
                Level: {Math.floor(points / 100) + 1} Elite
              </Badge>
            </div>
          </div>
        </div>

        {/* Input System */}
        <div className="relative group">
          <div className="absolute -inset-1 baddest-gradient rounded-[1.5rem] sm:rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
          <div className="relative flex items-center bg-zinc-950 border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-1.5 sm:p-2 pr-3 sm:pr-4 shadow-2xl">
            <div className="p-3 sm:p-4 text-zinc-700">
              <Plus size={20} className="sm:size-6" />
            </div>
            <Input
              placeholder="What's the next mission?"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              className="bg-transparent border-none text-base sm:text-xl font-bold placeholder:text-zinc-800 focus-visible:ring-0 h-12 sm:h-16 shadow-none"
            />
            <Button
              onClick={addTodo}
              className="size-10 sm:size-12 rounded-xl sm:rounded-2xl baddest-gradient hover:opacity-90 shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center p-0"
            >
              <Send size={16} className="sm:size-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3 sm:space-y-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {todos.filter(t => !t.completed).map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  x: 50,
                  transition: { duration: 0.4, ease: "backIn" }
                }}
                className="group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 glass-card border-white/5 rounded-2xl sm:rounded-3xl hover:border-orange-500/20 transition-all">
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => toggleTodo(todo.id)}
                    className="size-8 sm:size-10 rounded-lg sm:rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center group/btn hover:border-orange-500/50 transition-all shadow-inner"
                  >
                    <CheckCircle2 className="text-zinc-800 group-hover/btn:text-orange-500 transition-all pointer-events-none size-5 sm:size-6" />
                  </motion.button>

                  <span className="flex-1 text-base sm:text-lg font-bold text-zinc-100 tracking-tight">{todo.text}</span>

                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="size-8 sm:size-10 rounded-lg sm:rounded-2xl hover:bg-red-500/10 text-zinc-800 hover:text-red-500 transition-all flex items-center justify-center"
                  >
                    <Trash2 size={16} className="sm:size-4.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Completed History (Mini) */}
          <div className="pt-8 sm:pt-10 mt-8 sm:mt-10 border-t border-white/5">
            <h3 className="text-[8px] sm:text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-4 sm:mb-6 px-4">Completed History</h3>
            <div className="space-y-2 sm:space-y-3 opacity-40">
              <AnimatePresence mode="popLayout">
                {todos.filter(t => t.completed).map((todo) => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 grayscale border border-dashed border-white/5 rounded-xl sm:rounded-2xl scale-95 origin-center"
                  >
                    <CheckCircle2 size={16} className="sm:size-5 text-orange-500" />
                    <span className="flex-1 line-through text-xs sm:text-sm font-bold italic text-zinc-400">{todo.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {todos.length === 0 && (
            <div className="py-20 sm:py-32 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-flex p-6 sm:p-10 rounded-full bg-zinc-950 border border-white/5 mb-6 sm:mb-8"
              >
                <div className="size-16 sm:size-20 rounded-full border-4 border-dashed border-zinc-900 flex items-center justify-center">
                  <div className="size-10 sm:size-12 rounded-full baddest-gradient opacity-20 blur-xl animate-pulse" />
                </div>
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-zinc-300">VOID SPACE</h3>
              <p className="text-xs sm:text-sm font-bold text-zinc-600 mt-2 uppercase tracking-widest">No active missions detected.</p>
            </div>
          )}
        </div>
      </main>

      {/* Full-Screen Milestone Alert */}
      <AlertDialog open={!!showMilestone} onOpenChange={() => setShowMilestone(null)}>
        <AlertDialogContent className="bg-black/95 border-none backdrop-blur-3xl p-0 overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-[0_0_100px_rgba(249,115,22,0.2)] max-w-[90vw] sm:max-w-md">
          <div className="relative p-8 sm:p-12 text-center">
            <div className="absolute top-0 left-0 w-full h-[2px] baddest-gradient" />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 sm:w-32 sm:h-32 baddest-gradient rounded-full mx-auto flex items-center justify-center mb-6 sm:mb-8 shadow-[0_0_50px_rgba(249,115,22,0.4)]"
            >
              <Trophy size={40} className="sm:size-15 text-white" />
            </motion.div>

            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
                {showMilestone?.title}
              </h2>
              <p className="text-base sm:text-xl font-bold text-zinc-400">
                {showMilestone?.desc}
              </p>
            </div>

            <div className="mt-8 sm:mt-12">
              <AlertDialogAction
                onClick={() => setShowMilestone(null)}
                className="w-full baddest-gradient hover:opacity-90 text-white font-black italic h-12 sm:size-16 rounded-xl sm:rounded-2xl text-lg sm:text-xl shadow-[0_15px_40px_rgba(249,115,22,0.3)] transition-all active:scale-95"
              >
                LET'S GO ➔
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
