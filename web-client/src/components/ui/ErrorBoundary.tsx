"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4 p-6">
            <div className="w-12 h-12 bg-destructive/10 text-destructive flex items-center justify-center rounded-full">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-base animate-pulse">
                Đã xảy ra lỗi hiển thị
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs">
                Không thể tải cấu phần này. Vui lòng thử tải lại hoặc tải lại trang.
              </p>
            </div>
            <Button onClick={this.handleReset} size="sm" variant="outline">
              <RefreshCw size={12} className="mr-1" /> Thử lại
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
