"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    MessageSquare,
    Settings,
    LogOut,
    User as UserIcon,
    ChevronLeft,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
    History
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { LoginDialog } from "@/components/login-dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ className, isCollapsed, setIsCollapsed }: SidebarProps) {
    const { user, signOut } = useAuth()
    const pathname = usePathname()

    return (
        <div
            data-collapsed={isCollapsed}
            className={cn(
                "group flex flex-col gap-4 py-4 data-[collapsed=true]:py-4 h-full bg-muted/20 border-r transition-all duration-300 ease-in-out",
                isCollapsed ? "w-[60px]" : "w-64",
                className
            )}
        >
            <div className={cn("flex items-center px-2", isCollapsed ? "justify-center" : "justify-between px-4")}>
                {!isCollapsed && (
                    <div className="flex items-center gap-2 font-semibold">
                        <span className="">Fincha</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
            </div>

            <div className="flex-1 overflow-auto py-2">
                <nav className="grid gap-1 px-2">
                    <TooltipProvider delayDuration={0}>
                        <Link
                            href="/"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
                                pathname === "/" && "bg-accent text-accent-foreground",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <MessageSquare className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="flex items-center gap-4">
                                    New Chat
                                </TooltipContent>
                            </Tooltip>
                            {!isCollapsed && <span>New Chat</span>}
                        </Link>
                    </TooltipProvider>

                    {!isCollapsed && (
                        <div className="mt-6 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                            History
                        </div>
                    )}

                    <div className={cn("mt-2", isCollapsed ? "px-0 flex justify-center" : "px-2")}>
                        {user ? (
                            !isCollapsed ? (
                                <div className="text-xs text-muted-foreground italic px-2">No recent chats</div>
                            ) : (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                <History className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">History</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        ) : (
                            !isCollapsed && <div className="text-xs text-muted-foreground px-2">Sign in to view history</div>
                        )}
                    </div>
                </nav>
            </div>

            <div className="mt-auto p-2 border-t">
                {user ? (
                    <div className={cn("flex items-center gap-2", isCollapsed ? "justify-center flex-col" : "justify-between")}>
                        <div className={cn("flex items-center gap-2 overflow-hidden", isCollapsed && "justify-center")}>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border text-primary shrink-0">
                                <span className="text-xs font-medium">{user.email?.charAt(0).toUpperCase()}</span>
                            </div>
                            {!isCollapsed && (
                                <div className="text-xs overflow-hidden">
                                    <p className="font-medium truncate max-w-[120px]" title={user.email || ""}>{user.email}</p>
                                </div>
                            )}
                        </div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign Out">
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Sign Out</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ) : (
                    <LoginDialog>
                        <Button className={cn("w-full gap-2", isCollapsed && "px-0 justify-center")} variant="default" size={isCollapsed ? "icon" : "default"}>
                            <UserIcon className="h-4 w-4" />
                            {!isCollapsed && <span>Sign In</span>}
                        </Button>
                    </LoginDialog>
                )}
            </div>
        </div>
    )
}
