import React from "react";
import { Pen, Bot } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 font-sans text-neutral-800">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Pen className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold text-neutral-800">Shopify Content Generator</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-500">Powered by OpenAI</span>
            <Bot className="w-4 h-4 text-secondary" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-neutral-500 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Shopify Content Generator. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-neutral-500 hover:text-primary">
                Help
              </a>
              <a href="#" className="text-neutral-500 hover:text-primary">
                Settings
              </a>
              <a href="#" className="text-neutral-500 hover:text-primary">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
