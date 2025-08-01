import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquarePlus, Share2, Users } from 'lucide-react';
import DailyArticles from './doubts/DailyArticles';

/**
 * The main homepage for the application.
 * It serves as the landing page, introducing users to the key features
 * and guiding them to different parts of the app.
 */
export default function HomePage() {
  return (
    <div>
      {/* Hero Section: The main introduction to the app. */}
      <section className="text-center py-16 md:py-24 lg:py-32">
        <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-primary">
          StudySync
        </h1>
        <p className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          A smart, collaborative platform for students. Share resources, clarify doubts, and master your subjects together with a community of learners.
        </p>
        {/* Call-to-action buttons guiding users to key features. */}
        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button asChild size="lg" className="font-semibold w-full sm:w-auto">
            <Link href="/ask-doubt">
              <MessageSquarePlus className="mr-2 h-5 w-5" />
              Ask a Doubt
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="font-semibold w-full sm:w-auto">
            <Link href="/upload-notes">
              <Share2 className="mr-2 h-5 w-5" />
              Share Resource
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="font-semibold w-full sm:w-auto">
            <Link href="/doubts">
              <Users className="mr-2 h-5 w-5" />
              Community Doubts
            </Link>
          </Button>
        </div>
      </section>
      
      {/* "How It Works" Section: Explains the core value proposition in three steps. */}
      <section className="py-12 md:py-16">
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-2">A simple, three-step process to academic success.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 border rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 bg-card">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-accent mb-6">
                    <MessageSquarePlus className="h-8 w-8 text-accent-foreground"/>
                </div>
                <h3 className="text-2xl font-bold font-headline mb-3">Ask Anything</h3>
                <p className="text-muted-foreground">Stuck on a problem? Post your doubt with details to get clear, concise answers from peers and mentors.</p>
            </div>
            <div className="p-8 border rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 bg-card">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-accent mb-6">
                    <Share2 className="h-8 w-8 text-accent-foreground"/>
                </div>
                <h3 className="text-2xl font-bold font-headline mb-3">Share Knowledge</h3>
                <p className="text-muted-foreground">Contribute by sharing helpful YouTube videos or Google Drive links for notes, summaries, and other study materials.</p>
            </div>
            <div className="p-8 border rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 bg-card">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-accent mb-6">
                    <Users className="h-8 w-8 text-accent-foreground"/>
                </div>
                <h3 className="text-2xl font-bold font-headline mb-3">Learn Together</h3>
                <p className="text-muted-foreground">Explore a crowd-sourced library of resources and a live feed of questions to deepen your understanding and collaboration.</p>
            </div>
        </div>
      </section>

      {/* Daily Articles Section: A placeholder for a future AI-powered feature. */}
      <section className="py-12 md:py-16">
        <DailyArticles />
      </section>

      {/* Footer Section: Contains the copyright notice. */}
      <footer className="text-center py-8 text-sm text-muted-foreground border-t">
        <p>&copy; 2025 Copyright Reserved by Abhay</p>
      </footer>
    </div>
  );
}
