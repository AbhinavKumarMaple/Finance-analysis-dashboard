import * as React from "react"

interface TooltipProps {
    children: React.ReactNode
    content: string
    className?: string
}

export function Tooltip({ children, content, className = "" }: TooltipProps) {
    const [isVisible, setIsVisible] = React.useState(false)

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="cursor-help"
            >
                {children}
            </div>
            {isVisible && (
                <div
                    className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg w-64 -top-2 left-full ml-2 ${className}`}
                    style={{ whiteSpace: "normal" }}
                >
                    {content}
                    <div className="absolute top-3 -left-1 w-2 h-2 bg-gray-900 transform rotate-45" />
                </div>
            )}
        </div>
    )
}
