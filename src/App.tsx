import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Trophy,
  LayoutGrid,
  Flame,
  Volume2,
  VolumeX,
} from "lucide-react";
import confetti from "canvas-confetti";
import * as Tone from "tone";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StreakBadge } from "@/components/StreakBadge";

// --- Types ---

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

// --- Constants ---

const BADGES_CONFIG = [
  { id: "beginner", name: "Beginner", description: "Complete 5 tasks", count: 5 },
  { id: "pro", name: "Pro", description: "Complete 50 tasks", count: 50 },
  { id: "streak_king", name: "Streak King", description: "Reach a 30-day streak", streak: 30 },
  { id: "first_task", name: "First Step", description: "Complete your first task", count: 1 },
];

// --- App Component ---

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem("todos");
    return saved ? JSON.parse(saved) : [];
  });

  const [inputValue, setInputValue] = useState("");
  const [streak, setStreak] = useState(() => Number(localStorage.getItem("streak")) || 0);
  const [points, setPoints] = useState(() => Number(localStorage.getItem("points")) || 0);
  const [lastCompletedDate, setLastCompletedDate] = useState(() => localStorage.getItem("lastCompletedDate") || "");
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem("badges");
    return saved ? JSON.parse(saved) : [];
  });

  const [isMuted, setIsMuted] = useState(false);
  const [showMilestone, setShowMilestone] = useState<{ title: string, desc: string } | null>(null);

  const synth = useRef<Tone.Synth | null>(null);

  // --- Effects ---

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem("streak", streak.toString());
    localStorage.setItem("points", points.toString());
    localStorage.setItem("lastCompletedDate", lastCompletedDate);
    localStorage.setItem("badges", JSON.stringify(unlockedBadges));
  }, [streak, points, lastCompletedDate, unlockedBadges]);

  useEffect(() => {
    // Check for streak reset on load
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastCompletedDate && lastCompletedDate !== today && lastCompletedDate !== yesterdayStr) {
      setStreak(0);
    }
  }, [lastCompletedDate]);

  useEffect(() => {
    // Initialize Tone.js
    synth.current = new Tone.Synth().toDestination();
    return () => {
      synth.current?.dispose();
    };
  }, []);

  // --- Helpers ---

  const playCompleteSound = () => {
    if (isMuted || !synth.current) return;
    try {
      synth.current.triggerAttackRelease("C5", "8n");
      setTimeout(() => synth.current?.triggerAttackRelease("G5", "8n"), 100);
    } catch (e) {
      console.error("Audio failed", e);
    }
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

  const updateStreak = () => {
    const today = new Date().toDateString();
    if (lastCompletedDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastCompletedDate === yesterday.toDateString()) {
      setStreak(prev => prev + 1);
    } else if (lastCompletedDate === "") {
      setStreak(1);
    } else {
      // Check if missed days? For simplicity, if not yesterday, reset.
      // But user said "reset if no complete", so we'll just set to 1 if first for today.
      setStreak(prev => (lastCompletedDate === yesterday.toDateString() ? prev + 1 : 1));
    }
    setLastCompletedDate(today);
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
        playCompleteSound();
        triggerConfetti();

        // Update Streak & Points
        updateStreak();
        const multiplier = streak >= 7 ? 2 : 1;
        setPoints(p => p + (10 * multiplier));

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
  const streakProgress = (streak % 7) / 7 * 100;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans selection:bg-orange-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-orange-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10 space-y-8">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic flex items-center gap-2">
              DO IT <span className="text-orange-500 underline decoration-4 underline-offset-4">NOW</span>
              <Flame className="text-orange-500 animate-pulse" />
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Power up your productivity.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="text-muted-foreground hover:text-white"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
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
                  <SheetDescription className="text-muted-foreground">
                    Your achievements and milestones.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid grid-cols-1 gap-4">
                  {BADGES_CONFIG.map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-xl border transition-all duration-300 ${unlockedBadges.includes(badge.id)
                        ? "bg-secondary/50 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                        : "bg-secondary/10 border-border/30 opacity-40 grayscale"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${unlockedBadges.includes(badge.id) ? "bg-orange-500/20 text-orange-500" : "bg-muted text-muted-foreground"}`}>
                          <Trophy size={24} />
                        </div>
                        <div>
                          <p className="font-bold">{badge.name}</p>
                          <p className="text-xs text-muted-foreground">{badge.description}</p>
                        </div>
                        {unlockedBadges.includes(badge.id) && (
                          <CheckCircle2 size={16} className="ml-auto text-orange-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StreakBadge streak={streak} multiplier={multiplier} progress={streakProgress || 0} />

          <div className="p-4 bg-secondary/30 rounded-xl border border-border/50 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Points</p>
              <h2 className="text-4xl font-black text-white italic">{points}</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-orange-400 font-medium bg-orange-500/10 w-fit px-2 py-1 rounded-full border border-orange-500/20">
              <Plus size={12} />
              {multiplier * 10} pts per task
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
                <LayoutGrid size={40} className="text-muted-foreground/30" />
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
