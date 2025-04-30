import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface InfoPanelProps {
  connectionStatus?: {
    openai: string;
    googleSheets: string;
    shopify: string;
  };
}

export default function InfoPanel({ connectionStatus }: InfoPanelProps) {
  // Fetch recent content items
  const { data: recentContent, isLoading } = useQuery({
    queryKey: ['/api/recent-content'],
    staleTime: 60000, // 1 minute
  });

  // Format relative time (e.g., "2 hours ago")
  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Information</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Card */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Connection Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">OpenAI API</span>
              <StatusBadge status={connectionStatus?.openai || "loading"} />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Google Sheets</span>
              <StatusBadge status={connectionStatus?.googleSheets || "loading"} />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Shopify API</span>
              <StatusBadge status={connectionStatus?.shopify || "loading"} />
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">How It Works</h3>
          <ol className="text-xs text-neutral-600 space-y-2 list-decimal pl-4">
            <li>Fill in the content generation form with your preferences.</li>
            <li>Our AI uses OpenAI to create SEO-optimized content based on your inputs.</li>
            <li>Images are automatically added from your connected Google Sheet.</li>
            <li>The generated content is published directly to your Shopify store.</li>
          </ol>
        </div>
        
        {/* Recent Activity */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Recent Activity</h3>
          
          {isLoading && (
            <div className="text-xs text-neutral-500">Loading recent items...</div>
          )}
          
          {!isLoading && (!recentContent?.items || recentContent.items.length === 0) && (
            <div className="text-xs text-neutral-500">No recent content generated yet.</div>
          )}
          
          {!isLoading && recentContent?.items && recentContent.items.length > 0 && (
            <div className="space-y-3">
              {recentContent.items.map((item: any) => (
                <div key={item.id} className="flex items-start space-x-2 text-xs">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-3 w-3 text-secondary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-neutral-700 font-medium">{item.title}</p>
                    <p className="text-neutral-500">Published {getRelativeTime(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for status badges
function StatusBadge({ status }: { status: string }) {
  if (status === "connected") {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" /> Connected
      </Badge>
    );
  } else if (status === "missing") {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="w-3 h-3 mr-1" /> Missing Key
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
        Loading...
      </Badge>
    );
  }
}
