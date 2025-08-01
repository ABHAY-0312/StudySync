import DoubtsFeed from "./DoubtsFeed";

/**
 * This is the main page for viewing community doubts.
 * It serves as a container for the DoubtsFeed component, which handles
 * all the logic for fetching and displaying the doubts.
 */
export default function DoubtsPage() {
  return (
    <div className="py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-headline font-bold mb-2">Community Doubts</h1>
      <p className="text-muted-foreground mb-8">Browse questions from the community or offer your help.</p>
      
      {/* The main component that renders the live feed of doubts. */}
      <DoubtsFeed />
    </div>
  );
}
