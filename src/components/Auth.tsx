import React, { useState } from "react";
import * as jose from "jose";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, User } from "lucide-react";
import { motion } from "framer-motion";

const SECRET = new TextEncoder().encode("antigravity-todo-secret");
const ALG = "HS256";

export interface UserProfile {
    id: string;
    email: string;
}

interface AuthProps {
    onLogin: (user: UserProfile) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAuth = async () => {
        setIsLoading(true);
        // Simulating API delay
        await new Promise(r => setTimeout(r, 800));

        try {
            const userId = email.split("@")[0] || "user_" + Math.random().toString(36).substr(2, 5);
            const jwt = await new jose.SignJWT({ id: userId, email })
                .setProtectedHeader({ alg: ALG })
                .setIssuedAt()
                .setExpirationTime("2h")
                .sign(SECRET);

            localStorage.setItem("todo_jwt", jwt);
            onLogin({ id: userId, email });
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="dark min-h-screen flex items-center justify-center p-4 sm:p-6 bg-black relative overflow-hidden perspective-1000">
            {/* Ambient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/10 blur-[150px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-10 sm:mb-12 relative">
                    <motion.h1
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="text-5xl sm:text-7xl font-black text-white italic tracking-tighter mb-4 leading-none"
                    >
                        DO IT <span className="text-transparent bg-clip-text baddest-gradient drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">NOW</span>
                    </motion.h1>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground font-bold tracking-widest uppercase text-[8px] sm:text-[10px]">
                        <div className="h-[1px] w-6 sm:w-10 bg-zinc-800" />
                        Premium Productivity Interface
                        <div className="h-[1px] w-6 sm:w-10 bg-zinc-800" />
                    </div>
                </div>

                <div className="glass-card border-white/5 overflow-hidden rounded-[2.5rem] p-4 sm:p-8">
                    <Tabs defaultValue="login" className="flex flex-col gap-6 w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-2xl h-auto border border-white/5" variant="line">
                            <TabsTrigger
                                value="login"
                                className="rounded-xl py-3 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/20 transition-all font-black italic text-sm"
                            >
                                LOGIN
                            </TabsTrigger>
                            <TabsTrigger
                                value="register"
                                className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg transition-all font-black italic text-sm"
                            >
                                JOIN
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1">
                            <TabsContent value="login" className="space-y-6">
                                <AuthForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} label="Identification" />
                                <Button
                                    onClick={() => handleAuth()}
                                    disabled={isLoading || !email}
                                    className="w-full baddest-gradient hover:opacity-90 text-white font-black italic h-14 rounded-2xl shadow-[0_10px_30px_rgba(249,115,22,0.3)] transition-all active:scale-[0.98] mt-4"
                                >
                                    {isLoading ? "VERIFYING..." : "ENTER WORKSPACE ➔"}
                                </Button>
                            </TabsContent>

                            <TabsContent value="register" className="space-y-6">
                                <AuthForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} label="Master Profile" />
                                <Button
                                    onClick={() => handleAuth()}
                                    disabled={isLoading || !email}
                                    className="w-full bg-white hover:bg-zinc-200 text-black font-black italic h-14 rounded-2xl shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] mt-4"
                                >
                                    {isLoading ? "INITIALIZING..." : "CREATE MASTER PROFILE ➔"}
                                </Button>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <p className="text-center text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-8 sm:mt-12">
                    Secured by JWT-SYSTREX // Data Encryption Layer Active
                </p>
            </motion.div>
        </div>
    );
};

const AuthForm = ({ email, setEmail, password, setPassword, label }: any) => (
    <div className="space-y-5">
        <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4 group-focus-within:text-orange-500 transition-colors">{label}</label>
            <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                <Input
                    placeholder="email@access.sys"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 bg-zinc-950/60 border-white/10 h-14 rounded-[1.25rem] focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 placeholder:text-zinc-700 transition-all text-white"
                />
            </div>
        </div>
        <div className="space-y-2 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4 group-focus-within:text-orange-500 transition-colors">Security Key</label>
            <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 bg-zinc-950/60 border-white/10 h-14 rounded-[1.25rem] focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 placeholder:text-zinc-700 transition-all text-white"
                />
            </div>
        </div>
    </div>
);
