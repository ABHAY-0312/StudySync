"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, serverTimestamp, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, CheckCircle, Loader2, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// TypeScript interfaces for our main data structures.
interface Doubt {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  description:string;
  createdAt: any;
  isResolved: boolean;
}

interface Answer {
  id: string;
  userId: string;
  userName:string;
  text: string;
  createdAt: any;
}

/**
 * A component that fetches and displays a list of answers for a specific doubt.
 * It uses a real-time listener (onSnapshot) to update automatically when new answers are added.
 */
function AnswerList({ doubtId }: { doubtId: string }) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      setFetchError("The application is not connected to the database. Please check your Firebase configuration.");
      return;
    }

    // This query fetches all documents from the 'answers' collection where 'doubtId' matches.
    const q = query(
      collection(db, "answers"),
      where("doubtId", "==", doubtId),
      orderBy("createdAt", "asc")
    );

    // onSnapshot creates a real-time subscription to the query.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const answersData: Answer[] = [];
      querySnapshot.forEach((doc) => {
        answersData.push({ id: doc.id, ...doc.data() } as Answer);
      });
      setAnswers(answersData);
      setFetchError(null);
      setLoading(false);
    }, (error: any) => {
      // This error handler is crucial for diagnosing problems, especially missing indexes.
      console.error("Firebase fetch error:", error);
      if (error.code === 'failed-precondition') {
        setFetchError("This feature requires a database index. Please open your browser's developer console (F12). You will find a link in the red Firebase error message. Click that link to create the index in the Firebase Console, then wait a few minutes and refresh this page.");
      } else {
        setFetchError(`An unexpected database error occurred: ${error.message}`);
      }
      setLoading(false);
    });
    
    // Cleanup function: unsubscribe from the real-time listener when the component unmounts.
    return () => unsubscribe();
  }, [doubtId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  if (fetchError) {
    return (
        <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Action Required: Database Index Missing</AlertTitle>
            <AlertDescription>
                <p>{fetchError}</p>
            </AlertDescription>
        </Alert>
    );
  }

  if (answers.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No answers yet. Be the first to help!</p>;
  }

  return (
    <div className="space-y-4">
      {answers.map((answer) => (
        <Card key={answer.id} className="bg-muted/50">
          <CardHeader className="p-4 pb-2">
            <p className="text-sm font-semibold text-foreground">{answer.userName}</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {answer.text && <p className="text-foreground break-words">{answer.text}</p>}
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-end items-center border-t mt-2">
            <p className="text-xs text-muted-foreground">
              {answer.createdAt ? formatDistanceToNow(answer.createdAt.toDate(), { addSuffix: true }) : 'just now'}
            </p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

/**
 * A dialog component that shows the full details of a doubt, the list of answers,
 * and a form to submit a new answer.
 */
function DoubtDetailsDialog({ doubt }: { doubt: Doubt }) {
    const { user } = useAuth();
    const [answer, setAnswer] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: "destructive", title: "Login Required" });
            router.push('/login');
            return;
        }
        if (!db) {
            toast({ variant: "destructive", title: "Error", description: "Database not configured." });
            return;
        }
        if (!answer.trim()) {
          toast({ variant: "destructive", title: "Empty Answer", description: "Please provide text for your answer." });
          return;
        };
        setIsSubmitting(true);

        try {
            // Add a new document to the 'answers' collection.
            await addDoc(collection(db, "answers"), {
                doubtId: doubt.id,
                userId: user.uid,
                userName: user.displayName,
                text: answer,
                createdAt: serverTimestamp(),
            });

            toast({ title: "Answer submitted!" });
            setAnswer(""); // Clear the textarea after submission.
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Could not submit your answer." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><MessageSquare className="mr-2 h-4 w-4" />View & Answer</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{doubt.subject} Doubt</DialogTitle>
                    <DialogDescription>
                      Posted by {doubt.userName} • {doubt.createdAt ? formatDistanceToNow(doubt.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 max-h-[70vh] overflow-y-auto pr-2 sm:pr-6 space-y-6">
                    <Card>
                        <CardContent className="p-4">
                           <p className="text-foreground break-words">{doubt.description}</p>
                        </CardContent>
                    </Card>

                    <div className="border-t pt-4">
                      <h3 className="font-headline text-xl mb-4">Community Answers</h3>
                      <AnswerList doubtId={doubt.id} />
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-headline text-xl mb-4">Post Your Answer</h3>
                      <form onSubmit={handleSubmit} className="space-y-4">
                          <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Explain your answer..." rows={4} />
                          <div className="flex justify-end">
                              <Button type="submit" disabled={isSubmitting}>
                                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Submit Answer
                              </Button>
                          </div>
                      </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


/**
 * The main component for the "Community Doubts" page. It fetches all doubts
 * and displays them in a grid.
 */
export default function DoubtsFeed() {
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!db) {
        setLoading(false);
        toast({ variant: "destructive", title: "Error", description: "Database not configured." });
        return;
    }
    // Query to get all documents from the 'doubts' collection, ordered by creation date.
    const q = query(collection(db, "doubts"), orderBy("createdAt", "desc"))
    // Use onSnapshot for a real-time feed of doubts.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const doubtsData: Doubt[] = []
      querySnapshot.forEach((doc) => {
        doubtsData.push({ id: doc.id, ...doc.data() } as Doubt)
      })
      setDoubts(doubtsData)
      setLoading(false)
    }, (error) => {
      toast({ variant: "destructive", title: "Error", description: "Could not fetch doubts." })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [toast])

  // Function to mark a doubt as resolved in Firestore.
  const handleMarkAsResolved = async (doubtId: string) => {
    if (!db) {
        toast({ variant: "destructive", title: "Error", description: "Database not configured." });
        return;
    }
    const doubtRef = doc(db, "doubts", doubtId)
    await updateDoc(doubtRef, { isResolved: true })
    toast({ title: "Resolved!", description: "You've marked this doubt as resolved." })
  }

  // A skeleton loader component to show while data is being fetched.
  const DoubtsLoadingSkeleton = () => (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="space-y-4 p-4">
            <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex justify-end pt-4">
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          </Card>
        ))}
      </div>
  )

  return (
    <>
      {loading ? (
        <DoubtsLoadingSkeleton />
      ) : doubts.length === 0 ? (
         <Card className="text-center py-12 md:py-24">
            <CardContent>
                <h3 className="text-2xl font-semibold font-headline">It's quiet in here...</h3>
                <p className="text-muted-foreground mt-2 mb-6">No doubts have been posted yet. Be the first to ask a question!</p>
                <Button asChild><Link href="/ask-doubt">Ask a Doubt</Link></Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {doubts.map((doubt) => (
            <Card key={doubt.id} className={`flex flex-col transition-all ${doubt.isResolved ? 'bg-muted/50 border-green-500/30' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge variant="secondary">{doubt.subject}</Badge>
                  {doubt.isResolved && <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-4 w-4 mr-1"/>Resolved</Badge>}
                </div>
                 <p className="text-xs text-muted-foreground pt-2">
                      by {doubt.userName} • {doubt.createdAt ? formatDistanceToNow(doubt.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                </p>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-foreground line-clamp-4 break-words">{doubt.description}</p>
              </CardContent>
              <CardFooter className="flex justify-end items-center border-t pt-4 mt-4">
                <div className="flex gap-2">
                  <DoubtDetailsDialog doubt={doubt} />
                  {/* The "Resolve" button only appears if the logged-in user is the one who posted the doubt. */}
                  {user?.uid === doubt.userId && !doubt.isResolved && (
                    <Button variant="secondary" size="sm" onClick={() => handleMarkAsResolved(doubt.id)}>
                      Resolve
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
