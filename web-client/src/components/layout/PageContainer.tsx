import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "main" | "section" | "div";
}

export function PageContainer({ children, className, as: Tag = "main" }: PageContainerProps) {
  return (
    <Tag
      className={cn(
        "container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-300",
        className
      )}
    >
      {children}
    </Tag>
  );
}
