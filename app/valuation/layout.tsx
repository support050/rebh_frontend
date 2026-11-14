import React from "react";

export default function ValuationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      <main className="flex-1 w-full bg-white min-h-[80vh] shadow-sm border-x border-gray-200">
        {children}
      </main>
    </div>
  );
}
