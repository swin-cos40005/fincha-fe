"use client"

import * as React from "react"
import { Sidebar } from "@/components/sidebar"

interface SidebarLayoutProps {
    children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-muted/20">
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                className="hidden lg:flex border-r"
            />
            <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                {children}
            </div>
        </div>
    )
}