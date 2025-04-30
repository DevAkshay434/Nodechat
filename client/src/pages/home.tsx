import React, { useState } from "react";
import ContentGeneratorForm from "@/components/ContentGeneratorForm";
import InfoPanel from "@/components/InfoPanel";
import ContentPreview from "@/components/ContentPreview";
import StatusAlert from "@/components/StatusAlert";
import { useQuery } from "@tanstack/react-query";
import type { GeneratedContentResponse, GoogleSheetsImage, ShopifyPublishResponse } from "@shared/schema";

interface GenerationResult {
  success: boolean;
  contentId?: number;
  content?: string;
  images?: GoogleSheetsImage[];
  metadata?: {
    wordCount?: number;
    seoScore?: number;
    keywords?: string[];
  };
  shopify?: ShopifyPublishResponse;
}

export default function Home() {
  const [statusType, setStatusType] = useState<"success" | "error" | "loading" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  // Fetch API connection status
  const { data: connectionStatus } = useQuery({
    queryKey: ['/api/check-connections'],
    staleTime: 300000, // 5 minutes
  });

  // Handle form submission result
  const handleGenerationResult = (result: GenerationResult) => {
    if (result.success) {
      setStatusType("success");
      setStatusMessage(result.shopify 
        ? `Content successfully generated and published to ${result.shopify.url}` 
        : "Content successfully generated");
      setGenerationResult(result);
    } else {
      setStatusType("error");
      setStatusMessage("Failed to generate content. Please try again.");
      setGenerationResult(null);
    }
  };

  // Handle errors and loading states from the form component
  const handleStatusChange = (type: "success" | "error" | "loading" | null, message: string = "") => {
    setStatusType(type);
    setStatusMessage(message);
    
    if (type === "loading") {
      // Clear any previous preview when starting a new generation
      setGenerationResult(null);
    }
  };

  // Dismiss status alerts
  const dismissAlert = () => {
    setStatusType(null);
    setStatusMessage("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Status Alerts */}
      {statusType && (
        <StatusAlert 
          type={statusType} 
          message={statusMessage} 
          onDismiss={dismissAlert} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Content Generation Form */}
        <div className="md:col-span-2">
          <ContentGeneratorForm 
            onGenerationComplete={handleGenerationResult}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Info Panel */}
        <div className="md:col-span-1">
          <InfoPanel 
            connectionStatus={connectionStatus?.connections} 
          />
        </div>
      </div>

      {/* Content Preview */}
      {generationResult?.content && (
        <ContentPreview 
          content={generationResult.content}
          images={generationResult.images || []}
          metadata={generationResult.metadata}
          shopifyResult={generationResult.shopify}
        />
      )}
    </div>
  );
}
