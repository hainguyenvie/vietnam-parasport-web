import React from 'react';
import { FileQuestion } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2 my-8">
      <CardContent className="flex flex-col items-center justify-center p-10 text-center">
        <div className="w-16 h-16 bg-muted text-muted-foreground flex items-center justify-center rounded-full mb-4">
          {icon || <FileQuestion size={32} />}
        </div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}
        {action && <div>{action}</div>}
      </CardContent>
    </Card>
  );
}
