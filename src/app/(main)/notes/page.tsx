"use client"

import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Frown } from 'lucide-react'
import ResourceCard from './ResourceCard'

// Define a TypeScript interface for the shape of a resource document.
// This helps with type safety and autocompletion.
export interface Resource {
    id: string
    topic: string
    subject: string
    description?: string
    resourceUrl: string
    resourceType: 'youtube' | 'drive'
    userName: string
    createdAt: any
}

/**
 * The main page component for displaying all shared resources.
 * It fetches data from Firestore in real-time and displays it in a grid of ResourceCard components.
 */
export default function NotesPage() {
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!db) {
            setError("Database not available. Please check Firebase configuration.")
            setLoading(false)
            return
        }
        // Create a query to fetch all documents from the 'notes' collection,
        // ordered by creation date in descending order (newest first).
        const q = query(collection(db, "notes"), orderBy("createdAt", "desc"))
        
        // `onSnapshot` creates a real-time listener. The callback function will be
        // executed every time the query results change.
        const unsubscribe = onSnapshot(q, 
            (querySnapshot) => {
                const resourcesData: Resource[] = []
                querySnapshot.forEach((doc) => {
                    resourcesData.push({ id: doc.id, ...doc.data() } as Resource)
                })
                setResources(resourcesData)
                setLoading(false)
            },
            (err) => {
                // Handle any errors that occur during the fetch.
                console.error(err)
                setError("Failed to fetch resources from the database.")
                setLoading(false)
            }
        )

        // The cleanup function returned by useEffect. It unsubscribes from the
        // listener when the component is unmounted to prevent memory leaks.
        return () => unsubscribe()
    }, [])

    return (
        <div className="py-8 md:py-12">
            <h1 className="text-3xl md:text-4xl font-headline font-bold mb-2">Resource Library</h1>
            <p className="text-muted-foreground mb-8">Browse notes and videos shared by the community.</p>

            {/* Show a skeleton loader while the initial data is being fetched. */}
            {loading && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-lg" />)}
                </div>
            )}

            {/* Display an error message if the data fetch fails. */}
            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* If loading is complete and there are no resources, show an empty state message. */}
            {!loading && !error && resources.length === 0 && (
                 <div className="text-center py-16 md:py-24 rounded-lg border bg-card">
                    <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-2xl font-semibold font-headline">Nothing here yet</h3>
                    <p className="mt-2 text-muted-foreground">No resources have been shared. Be the first!</p>
                </div>
            )}
            
            {/* If data is loaded successfully, map over the resources and render a ResourceCard for each one. */}
            {!loading && !error && resources.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {resources.map(resource => (
                        <ResourceCard key={resource.id} resource={resource} />
                    ))}
                </div>
            )}
        </div>
    )
}
