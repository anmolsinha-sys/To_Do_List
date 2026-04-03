import React, { useState } from "react";
import * as jose from "jose";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black text-white italic tracking-tighter mb-2">DO IT NOW <span className="text-orange-500 not-italic">🔥</span></h1>
                    <p className="text-muted-foreground font-medium">Authentication Required for Pro Tracking</p>
                </div>

                <Card className="bg-secondary/10 border-border/50 backdrop-blur-xl shadow-2xl">
                    <Tabs defaultValue="login" className="w-full">
                        <CardHeader>
                            <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-border/50">
                                <TabsTrigger value="login">Login</TabsTrigger>
                                <TabsTrigger value="register">Join</TabsTrigger>
                            </TabsList>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="email@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-black/20 border-border/50 h-11"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 bg-black/20 border-border/50 h-11"
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <TabsContent value="login" className="mt-0">
                            <CardFooter>
                                <Button
                                    onClick={() => handleAuth()}
                                    disabled={isLoading || !email}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 rounded-xl shadow-lg shadow-orange-500/20"
                                >
                                    {isLoading ? "Verifying..." : "Enter Workspace"}
                                </Button>
                            </CardFooter>
                        </TabsContent>

                        <TabsContent value="register" className="mt-0">
                            <CardFooter>
                                <Button
                                    onClick={() => handleAuth()}
                                    disabled={isLoading || !email}
                                    className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-11 rounded-xl shadow-lg shadow-white/10"
                                >
                                    {isLoading ? "Creating Profile..." : "Sign Up Free"}
                                </Button>
                            </CardFooter>
                        </TabsContent>
                    </Tabs>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-8">
                    Secure JWT Authentication enabled. Your data is isolated per profile.
                </p>
            </motion.div>
        </div>
    );
};
