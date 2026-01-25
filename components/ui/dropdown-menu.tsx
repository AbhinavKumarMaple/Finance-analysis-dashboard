import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextType {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType>({
    open: false,
    setOpen: () => { },
});

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Close on escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        if (open) {
            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }
    }, [open]);

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            // Use setTimeout to avoid closing immediately after opening
            setTimeout(() => {
                document.addEventListener("mousedown", handleClickOutside);
            }, 0);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [open]);

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div ref={containerRef} className="relative inline-block text-left">{children}</div>
        </DropdownMenuContext.Provider>
    );
};

const DropdownMenuTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setOpen(!open);
        props.onClick?.(e);
    };

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            ref,
            onClick: handleClick,
        });
    }

    return (
        <button
            ref={ref}
            className={cn("inline-flex items-center justify-center", className)}
            onClick={handleClick}
            {...props}
        >
            {children}
        </button>
    );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { open } = React.useContext(DropdownMenuContext);

    if (!open) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md border border-gray-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-gray-800 dark:bg-gray-950",
                className
            )}
            {...props}
        >
            <div className="py-1">{children}</div>
        </div>
    );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { setOpen } = React.useContext(DropdownMenuContext);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        props.onClick?.(e);
        setOpen(false); // Close dropdown after clicking item
    };

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex cursor-pointer select-none items-center px-4 py-2 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800",
                className
            )}
            onClick={handleClick}
            {...props}
        >
            {children}
        </div>
    );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
