import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border border-transparent hover:border-border hover:bg-muted transition-all">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl p-2 glass-effect border-none shadow-2xl">
        <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-xl font-bold py-2 cursor-pointer">
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-xl font-bold py-2 cursor-pointer">
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-xl font-bold py-2 cursor-pointer">
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
