import { Resource } from './page'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Youtube as YoutubeIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

/**
 * A utility function to extract the YouTube video ID from various URL formats.
 * This is important for embedding videos correctly.
 * @param url The YouTube URL.
 * @returns The video ID, or null if the URL is invalid.
 */
function getYouTubeVideoId(url: string) {
    if (!url) return null;
    // This regex covers standard watch URLs, short URLs (youtu.be), and shorts.
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// A simple SVG component for the Google Drive icon.
const GoogleDriveIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.29 14.88L2.05 7.62l4.24-7.35q.1-.16.24-.24t.28-.08h8.38q.14 0 .28.08t.24.24l4.24 7.35-4.24 7.35q-.1-.16-.24-.24t-.28-.08H7.95q-.14 0-.28-.08t-.24-.24zM8.37 13.4l5.41-9.38L19.19 12H8.37z" /></svg>
)

/**
 * A component that displays a single shared resource (either a YouTube video or a Google Drive link)
 * in a card format. It intelligently decides whether to show an embedded video player or a link button.
 */
export default function ResourceCard({ resource }: { resource: Resource }) {
    const videoId = resource.resourceType === 'youtube' ? getYouTubeVideoId(resource.resourceUrl) : null;

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start gap-2">
                    <Badge variant="secondary" className="whitespace-nowrap">{resource.subject}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1.5">
                       {/* Display the correct icon based on the resource type. */}
                       {resource.resourceType === 'youtube' ? <YoutubeIcon/> : <GoogleDriveIcon />} 
                       <span className="capitalize">{resource.resourceType}</span>
                    </Badge>
                </div>
                 <CardTitle className="font-headline text-xl pt-2 break-words">{resource.topic}</CardTitle>
                <CardDescription>
                    by {resource.userName} • {resource.createdAt ? formatDistanceToNow(resource.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                {/* If it's a valid YouTube link, embed the video player. */}
                {videoId ? (
                    <div className="aspect-video">
                        <iframe
                            className="w-full h-full rounded-md border"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                ) : (
                    // Otherwise, show the description or a fallback message.
                    <p className="text-sm text-muted-foreground line-clamp-4">
                        {resource.description || "No description provided."}
                    </p>
                )}
            </CardContent>
            <CardFooter className="border-t pt-4 mt-auto">
                {/* Logic to display the correct button or message in the footer. */}
                {resource.resourceType === 'drive' && (
                     <Button asChild className="w-full">
                        <a href={resource.resourceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> View on Google Drive
                        </a>
                    </Button>
                )}
                 {resource.resourceType === 'youtube' && !videoId && (
                     <p className="text-sm text-destructive text-center w-full">Could not embed: Invalid YouTube URL.</p>
                )}
                 {resource.resourceType === 'youtube' && videoId && (
                     <Button asChild variant="secondary" className="w-full">
                        <a href={resource.resourceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> Watch on YouTube
                        </a>
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
