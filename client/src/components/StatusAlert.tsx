import React from "react";
import { AlertCircle, CheckCircle, Loader2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface StatusAlertProps {
  type: "success" | "error" | "loading" | null;
  message: string;
  onDismiss: () => void;
}

export default function StatusAlert({ type, message, onDismiss }: StatusAlertProps) {
  if (!type) return null;

  let iconComponent, alertClass;
  
  switch (type) {
    case "success":
      iconComponent = <CheckCircle className="h-4 w-4 text-green-500" />;
      alertClass = "border-green-500 bg-green-50 text-green-700";
      break;
    case "error":
      iconComponent = <AlertCircle className="h-4 w-4 text-red-500" />;
      alertClass = "border-red-500 bg-red-50 text-red-700";
      break;
    case "loading":
      iconComponent = <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      alertClass = "border-blue-500 bg-blue-50 text-blue-700";
      break;
    default:
      return null;
  }

  return (
    <Alert className={`mb-6 ${alertClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            {iconComponent}
          </div>
          <AlertDescription className="ml-3 text-sm font-medium">
            {message}
          </AlertDescription>
        </div>
        {type !== "loading" && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss} 
            className="-my-1 -mx-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </Alert>
  );
}
