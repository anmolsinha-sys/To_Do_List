import React from "react";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface StreakBadgeProps {
    streak: number;
    multiplier: number;
    progress: number; // 0 to 100
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, multiplier, progress }) => {
    return (
        <div className="flex flex-col items-center gap-2 p-4 bg-secondary/30 rounded-xl border border-border/50 backdrop-blur-sm">
            <div className="relative">
                <motion.div
                    animate={{
                        scale: streak > 0 ? [1, 1.2, 1] : 1,
                        rotate: streak > 0 ? [0, 5, -5, 0] : 0,
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: streak > 0 ? Infinity : 0,
                        repeatDelay: 2,
                    }}
                    className={`${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`}
                >
                    <Flame size={48} fill={streak > 0 ? "currentColor" : "none"} />
                </motion.div>
                {multiplier > 1 && (
                    <Badge className="absolute -top-1 -right-4 bg-orange-600 hover:bg-orange-700 animate-pulse">
                        x{multiplier}
                    </Badge>
                )}
            </div>

            <div className="text-center">
                <p className="text-2xl font-bold tracking-tight">{streak} Day Streak</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                    {multiplier > 1 ? "Multiplier Active" : "Keep it up!"}
                </p>
            </div>

            <div className="w-full space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
            </div>
        </div>
    );
};
