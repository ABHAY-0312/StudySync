"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, HelpCircle, FileText, MessageSquare, ExternalLink, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from '@/hooks/use-toast'

// Define TypeScript interfaces for the data shapes we expect from Firestore.
interface Doubt { id: string; description: string; subject: string; isResolved: boolean; }
interface Note { id: string; topic: string; subject: string; resourceUrl: string; }
interface Answer { id: string; text: string; doubtId: string; }

/**
 * A reusable component to display a user-friendly error message when a Firestore query fails.
 * This is especially helpful for guiding users to create necessary indexes in Firebase.
 */
const IndexErrorMessage = ({ error }: { error: string | null }) => {
    if (!error) return null;
    return (
        <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Action Required: Database Query Failed</AlertTitle>
            <AlertDescription>
                <p className="font-bold mb-2">Could not load data for this tab.</p>
                <p>This usually happens because a required database index is missing. Please open your browser's developer console (F12), find the red Firebase error message, and click the link inside it to create the index in the Firebase Console. After a few minutes, refresh this page.</p>
            </AlertDescription>
        </Alert>
    );
}

// The main component for the user dashboard page.
export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    
    // State to hold the data fetched from Firestore.
    const [myDoubts, setMyDoubts] = useState<Doubt[]>([])
    const [myNotes, setMyNotes] = useState<Note[]>([])
    const [myAnswers, setMyAnswers] = useState<Answer[]>([])
    
    // State to hold any errors that occur during data fetching for each tab.
    const [doubtsError, setDoubtsError] = useState<string | null>(null);
    const [notesError, setNotesError] = useState<string | null>(null);
    const [answersError, setAnswersError] = useState<string | null>(null);

    // A general loading state for the initial data fetch.
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Redirect to login if auth is done and there's no user.
        if (!authLoading && !user) {
            router.push('/login')
             toast({
                variant: "destructive",
                title: "Authentication Required",
                description: "You need to be logged in to view the dashboard.",
            })
            return;
        }
        // Fetch data only if there is a logged-in user.
        if (user) {
            const fetchData = async () => {
                setLoading(true)
                if (!db) {
                    setLoading(false);
                    return;
                }
                
                // Clear previous errors before fetching new data.
                setDoubtsError(null);
                setNotesError(null);
                setAnswersError(null);

                // Fetch all data in parallel for better performance.
                const [doubtsResult, notesResult, answersResult] = await Promise.allSettled([
                    // Query for doubts created by the current user, ordered by creation date.
                    getDocs(query(collection(db, 'doubts'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))),
                    // Query for notes shared by the current user.
                    getDocs(query(collection(db, 'notes'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))),
                    // Query for answers written by the current user.
                    getDocs(query(collection(db, 'answers'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))),
                ]);

                // Handle the result for each query, setting state or capturing errors.
                if (doubtsResult.status === 'fulfilled') {
                    setMyDoubts(doubtsResult.value.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doubt)));
                } else {
                    console.error("Doubts fetch error:", doubtsResult.reason);
                    setDoubtsError(doubtsResult.reason.message);
                }

                if (notesResult.status === 'fulfilled') {
                    setMyNotes(notesResult.value.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
                } else {
                    console.error("Notes fetch error:", notesResult.reason);
                    setNotesError(notesResult.reason.message);
                }

                if (answersResult.status === 'fulfilled') {
                    setMyAnswers(answersResult.value.docs.map(doc => ({ id: doc.id, ...doc.data() } as Answer)));
                } else {
                    console.error("Answers fetch error:", answersResult.reason);
                    setAnswersError(answersResult.reason.message);
                }

                setLoading(false)
            }
            fetchData()
        }
    }, [user, authLoading, router, toast])
    
    // Show a loading spinner while auth state is being determined or data is being fetched.
    if (authLoading || loading) {
        return <div className="flex items-center justify-center h-screen -my-20"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
    }
    
    // This should not happen if the useEffect redirect works, but it's a good safeguard.
    if (!user) return null

    return (
        <div className="py-8 md:py-12">
            <h1 className="text-3xl md:text-4xl font-headline font-bold mb-2 break-words">Welcome, {user.displayName}</h1>
            <p className="text-muted-foreground mb-8">Track your activity and contributions to the community.</p>
            
            <Tabs defaultValue="doubts" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
                    <TabsTrigger value="doubts"><HelpCircle className="mr-2 h-4 w-4"/>My Doubts</TabsTrigger>
                    <TabsTrigger value="notes"><FileText className="mr-2 h-4 w-4"/>My Resources</TabsTrigger>
                    <TabsTrigger value="answers"><MessageSquare className="mr-2 h-4 w-4"/>My Answers</TabsTrigger>
                </TabsList>

                {/* Content for "My Doubts" tab */}
                <TabContentTemplate value="doubts" title="My Posted Doubts" data={myDoubts} emptyMessage="You haven't posted any doubts yet." error={doubtsError}>
                    {myDoubts.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-4 border rounded-lg">
                            <p className="truncate pr-4">{d.description}</p>
                            <Badge variant={d.isResolved ? 'default' : 'secondary'} className={d.isResolved ? 'bg-green-100 text-green-800' : ''}>
                                {d.isResolved ? 'Resolved' : 'Open'}
                            </Badge>
                        </div>
                    ))}
                </TabContentTemplate>

                {/* Content for "My Resources" tab */}
                <TabContentTemplate value="notes" title="My Shared Resources" data={myNotes} emptyMessage="You haven't shared any resources yet." error={notesError}>
                    {myNotes.map(n => (
                        <a key={n.id} href={n.resourceUrl} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <p className="truncate pr-4">{n.topic} <span className="text-muted-foreground text-sm">({n.subject})</span></p>
                            <ExternalLink className="h-5 w-5 text-primary" />
                        </a>
                    ))}
                </TabContentTemplate>
                
                {/* Content for "My Answers" tab */}
                <TabContentTemplate value="answers" title="My Answers" data={myAnswers} emptyMessage="You haven't answered any doubts yet." error={answersError}>
                    {myAnswers.map(a => (
                        <div key={a.id} className="p-4 border rounded-lg bg-background">
                            <p className="italic break-words">"{a.text}"</p>
                        </div>
                    ))}
                </TabContentTemplate>
            </Tabs>
        </div>
    )
}

/**
 * A reusable template component for the content of each tab.
 * It handles displaying the title, error messages, empty states, and the actual content.
 */
const TabContentTemplate = ({ value, title, data, emptyMessage, children, error }: { value: string, title: string, data: any[], emptyMessage: string, children: React.ReactNode, error: string | null }) => (
    <TabsContent value={value}>
        <Card>
            <CardHeader><CardTitle className="font-headline">{title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {error ? <IndexErrorMessage error={error} /> : (data.length > 0 ? children : <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>)}
            </CardContent>
        </Card>
    </TabsContent>
)
