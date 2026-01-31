"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
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
                "group flex flex-col h-full bg-muted/20 border-r transition-all duration-300 ease-in-out",
                isCollapsed ? "w-[60px]" : "w-64",
                className
            )}
        >
            <div className={cn(
                "flex items-center h-16 shrink-0",
                isCollapsed ? "justify-center px-2" : "justify-between px-4"
            )}>
                {!isCollapsed ? (
                    <>
                        <Link href="/" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                            <Image
                                src="/logo-light.png"
                                alt="Fincha"
                                width={30}
                                height={30}
                                className="object-contain block dark:hidden"
                                priority
                            />
                            <Image
                                src="/logo-dark.png"
                                alt="Fincha"
                                width={30}
                                height={30}
                                className="object-contain hidden dark:block"
                                priority
                            />
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 shrink-0"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            <PanelLeftClose className="size-5" />
                            <span className="sr-only">Toggle Sidebar</span>
                        </Button>
                    </>
                ) : (
                    <div className="relative w-full group">
                        <Link
                            href="/"
                            className="flex items-center justify-center rounded-lg px-2 py-2.5 hover:bg-accent hover:text-accent-foreground transition-all group-hover:opacity-0"
                        >
                            <Image
                                src="/logo-light.png"
                                alt="Fincha"
                                width={30}
                                height={30}
                                className="object-contain block dark:hidden"
                                priority
                            />
                            <Image
                                src="/logo-dark.png"
                                alt="Fincha"
                                width={30}
                                height={30}
                                className="object-contain hidden dark:block"
                                priority
                            />
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg px-2 py-2.5 size-auto absolute inset-0 mx-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setIsCollapsed(false)}
                        >
                            <PanelLeftOpen className="size-5" />
                            <span className="sr-only">Open Sidebar</span>
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto">
                <nav className="grid gap-1 px-2 py-4">
                    <TooltipProvider delayDuration={0}>
                        <Link
                            href="/"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
                                pathname === "/" && "bg-accent text-accent-foreground",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <MessageSquare className="size-5" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="flex items-center gap-4">
                                    New Chat
                                </TooltipContent>
                            </Tooltip>
                            {!isCollapsed && <span>New Chat</span>}
                        </Link>
                    </TooltipProvider>

                    {!isCollapsed && (
                        <div className="mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                            History
                        </div>
                    )}

                    <div className={cn("mt-2", isCollapsed ? "px-0 flex justify-center" : "px-2")}>
                        {user ? (
                            !isCollapsed ? (
                                <div className="text-xs text-muted-foreground italic px-2 py-1">No recent chats</div>
                            ) : (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-lg px-2 py-2.5 size-auto text-muted-foreground">
                                                <History className="size-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">History</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        ) : (
                            !isCollapsed && <div className="text-xs text-muted-foreground px-2 py-1">Sign in to view history</div>
                        )}
                    </div>
                </nav>
            </div>

            <div className="mt-auto p-3 border-t">
                {user ? (
                    <div className={cn(
                        "flex items-center gap-3",
                        isCollapsed ? "justify-center flex-col gap-2" : "justify-between"
                    )}>
                        <div className={cn(
                            "flex items-center gap-3 overflow-hidden min-w-0",
                            isCollapsed && "justify-center"
                        )}>
                            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shrink-0">
                                <span className="text-sm font-semibold">{user.email?.charAt(0).toUpperCase()}</span>
                            </div>
                            {!isCollapsed && (
                                <div className="text-xs overflow-hidden flex-1 min-w-0">
                                    <p className="font-medium truncate" title={user.email || ""}>{user.email}</p>
                                </div>
                            )}
                        </div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => signOut()}
                                        className="size-9 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                                        title="Sign Out"
                                    >
                                        <LogOut className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Sign Out</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ) : (
                    <Link href="/login" className="block">
                        <Button
                            className={cn(
                                "w-full gap-2 font-medium shadow-sm",
                                isCollapsed && "px-0 justify-center"
                            )}
                            variant="default"
                            size={isCollapsed ? "icon" : "default"}
                        >
                            <UserIcon className="size-4" />
                            {!isCollapsed && <span>Sign In</span>}
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    )
}
