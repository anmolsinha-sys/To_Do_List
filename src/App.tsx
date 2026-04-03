import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  LogOut
} from "lucide-react";
import * as Tone from "tone";
import confetti from "canvas-confetti";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { StreakBadge } from "@/components/StreakBadge";
import { Auth, type UserProfile } from "@/components/Auth";

// --- Types ---

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

// --- Constants ---

const BADGES_CONFIG = [
  { id: "first-step", name: "First Step", description: "Complete your first task", count: 1, icon: <CheckCircle2 /> },
  { id: "beginner", name: "Beginner", description: "Complete 5 tasks", count: 5, icon: <Trophy /> },
  { id: "pro", name: "Pro", description: "Complete 50 tasks", count: 50, icon: <Flame /> },
  { id: "streak-king", name: "Streak King", description: "Reach a 30-day streak", streak: 30, icon: <Flame /> },
];

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
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

  const checkBadges = (totalCompleted: number, currentStreak: number) => {
    BADGES_CONFIG.forEach(badge => {
      if (!unlockedBadges.includes(badge.id)) {
        let unlock = false;
        if (badge.count && totalCompleted >= badge.count) unlock = true;
        if (badge.streak && currentStreak >= badge.streak) unlock = true;

        if (unlock) {
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
  const multiplier = streak >= 7 ? 2 : 1;

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 selection:text-orange-500 font-sans p-4 md:p-8 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-2xl mx-auto space-y-8 relative z-10">
        {/* Header Section */}
        <header className="flex items-center justify-between p-4 bg-secondary/10 border border-border/50 rounded-3xl backdrop-blur-md sticky top-4 z-50">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="border-none bg-transparent hover:bg-white/5"
            >
              {isMuted ? <VolumeX className="text-muted-foreground" /> : <Volume2 className="text-orange-500" />}
            </Button>

            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-2 border-border/50 bg-secondary/20">
                    <Trophy size={16} className="text-yellow-500" />
                    <span className="hidden sm:inline">Badges</span>
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5">
                      {unlockedBadges.length}
                    </Badge>
                  </Button>
                }
              />
              <SheetContent className="bg-black border-l border-border/50 text-white overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-white text-2xl font-bold italic">Hall of Fame</SheetTitle>
                </SheetHeader>

                <div className="space-y-4">
                  {BADGES_CONFIG.map((badge) => {
                    const isUnlocked = unlockedBadges.includes(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={cn(
                          "p-4 rounded-2xl border transition-all duration-500",
                          isUnlocked
                            ? "bg-orange-500/10 border-orange-500/30 scale-100"
                            : "bg-secondary/5 border-border/20 grayscale opacity-40 scale-95"
                        )}
                      >
                        <div className="flex gap-4">
                          <div className={cn(
                            "p-3 rounded-xl",
                            isUnlocked ? "bg-orange-500/20 text-orange-500" : "bg-black/40 text-muted-foreground"
                          )}>
                            {badge.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{badge.name}</h3>
                            <p className="text-sm text-muted-foreground">{badge.description}</p>
                            {isUnlocked && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="mt-2 flex items-center gap-1 text-xs text-orange-400 font-bold uppercase tracking-wider"
                              >
                                <CheckCircle2 size={12} />
                                Earned
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUser(null)}
              className="gap-2 border-border/50 bg-secondary/20 h-8"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>

          <StreakBadge
            streak={streak}
            multiplier={multiplier}
            progress={(streak % 7) / 7 * 100}
          />
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-secondary/30 rounded-xl border border-border/50 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Points</p>
              <p className="text-4xl font-black text-white italic">{points}</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                Pro Tracking Active
              </Badge>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <form onSubmit={addTodo} className="flex gap-2 p-1.5 bg-secondary/20 rounded-2xl border border-border/50 backdrop-blur-md">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add a high-impact task..."
            className="border-none bg-transparent focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50 h-12"
          />
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20">
            <Plus size={24} strokeWidth={3} />
            <span className="hidden sm:inline ml-1 uppercase text-xs tracking-tighter">Enter</span>
          </Button>
        </form>

        {/* Todo List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {todos.filter(t => !t.completed).map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  x: 50,
                  scale: 0.9,
                  filter: "blur(10px)",
                  transition: { duration: 0.3 }
                }}
                className="group flex items-center gap-3 p-4 bg-secondary/10 hover:bg-secondary/20 border border-border/30 rounded-2xl transition-colors"
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className="text-muted-foreground hover:text-orange-500 transition-colors shrink-0"
                >
                  <Circle size={28} strokeWidth={1.5} />
                </button>
                <span className="flex-1 font-medium text-lg tracking-tight">{todo.text}</span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-2"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Completed Section Separator */}
          {todos.some(t => t.completed) && (
            <div className="pt-6 pb-2">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/50 px-2 flex items-center gap-4">
                Completed
                <div className="h-px bg-border/20 flex-1" />
              </h3>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {todos.filter(t => t.completed).map((todo) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3 p-4 bg-transparent border border-dashed border-border/20 rounded-2xl grayscale"
              >
                <CheckCircle2 size={24} className="text-orange-500 shrink-0" />
                <span className="flex-1 line-through text-muted-foreground italic font-medium">{todo.text}</span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-muted-foreground hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {todos.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-secondary/20 border border-border/50">
                <Circle size={40} className="text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-xl font-bold opacity-30 tracking-tight italic">Nothing on horizontal.</p>
                <p className="text-sm text-muted-foreground/40">Add something to break the silence.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Milestone Alert */}
      <AlertDialog open={!!showMilestone} onOpenChange={() => setShowMilestone(null)}>
        <AlertDialogContent className="bg-black/90 border-orange-500/50 backdrop-blur-xl">
          <AlertDialogHeader className="items-center text-center space-y-4">
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-500/50">
              <Trophy size={40} className="text-orange-500" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-3xl font-black text-white tracking-tighter italic">
                {showMilestone?.title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-lg">
                {showMilestone?.desc}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => setShowMilestone(null)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-12 h-12 rounded-xl"
            >
              LFG!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
