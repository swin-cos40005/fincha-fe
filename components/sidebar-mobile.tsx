
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Sidebar } from "@/components/sidebar"

export function MobileSidebar() {
    const [open, setOpen] = React.useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[300px]">
                <div className="h-full">
                    {/* Reuse Sidebar but force expanded state */}
                    <Sidebar
                        className="w-full border-none bg-background py-4"
                        isCollapsed={false}
                        setIsCollapsed={() => { }}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}
