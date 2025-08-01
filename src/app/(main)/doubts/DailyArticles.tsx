"use client";

import { Sparkles } from "lucide-react";

/**
 * A placeholder component for the "Daily Insights" section.
 * This is displayed on the homepage and indicates that a new feature
 * is under development. Using a placeholder is good practice to avoid
 * shipping broken or incomplete features.
 */
export default function DailyArticles() {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-headline font-bold mb-6">Daily Insights</h2>
      {/* The container for the placeholder card. */}
      <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/50 p-12 text-center space-y-2">
        <Sparkles className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-xl font-semibold text-foreground pt-2">
          Feature Upgrade Coming Soon!
        </h3>
        <p className="text-muted-foreground max-w-md">
          We're working on AI-powered daily insights and summaries. Stay tuned!
        </p>
      </div>
    </section>
  );
}
