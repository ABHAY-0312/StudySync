"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/context/auth-context"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Share2, AlertTriangle, Youtube } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// A predefined list of subjects for the dropdown menu.
const subjects = ["DSA", "DBMS", "OS", "CN", "Maths", "Physics", "Chemistry", "Other"]

// Define the form validation schema using Zod.
const formSchema = z.object({
  topic: z.string().min(5, { message: "Topic must be at least 5 characters." }),
  subject: z.string().min(1, { message: "Please select a subject." }),
  description: z.string().optional(),
  resourceType: z.enum(["youtube", "drive"], {
    required_error: "You need to select a resource type.",
  }),
  url: z.string().url({ message: "Please enter a valid URL." }),
}).refine(data => {
    // This custom refinement adds more specific URL validation based on the selected resource type.
    if (data.resourceType === 'youtube') {
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be|m\.youtube\.com|y2u\.be|yt\.be|music\.youtube\.com|gaming\.youtube\.com|studio\.youtube\.com|shorts\.youtube\.com|youtube-nocookie\.com)\/.+$/.test(data.url);
    }
    if (data.resourceType === 'drive') {
        return /^(https?:\/\/)?(drive\.google\.com)\/.+$/.test(data.url);
    }
    return true;
}, {
    message: "Please enter a valid URL for the selected resource type.",
    path: ["url"], // Apply this error message to the 'url' field.
});

// A simple SVG component for the Google Drive icon.
const GoogleDriveIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6.29 14.88L2.05 7.62l4.24-7.35q.1-.16.24-.24t.28-.08h8.38q.14 0 .28.08t.24.24l4.24 7.35-4.24 7.35q-.1.16-.24.24t-.28.08H7.95q-.14 0-.28-.08t-.24-.24zM8.37 13.4l5.41-9.38L19.19 12H8.37z" /></svg>
)

/**
 * The page component for sharing a new resource. It provides a form for users
 * to submit links to YouTube videos or Google Drive files.
 */
export default function ShareResourcePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null);

  // Initialize the form with react-hook-form and Zod schema.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      subject: "",
      description: "",
      resourceType: "youtube",
      url: "",
    },
  })

  // Display a loader while checking the user's auth status.
  if (authLoading) {
    return <div className="flex justify-center items-center h-full py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  // Redirect unauthenticated users to the login page.
  if (!user) {
    router.push("/login")
    toast({
      variant: "destructive",
      title: "Authentication Required",
      description: "You need to be logged in to share a resource.",
    })
    return null
  }

  // Handles the form submission process.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !db) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Firebase is not configured correctly. Please check your setup.",
      });
      return;
    }
    
    setError(null);
    setIsSubmitting(true)
    
    try {
      // Add a new document to the 'notes' collection in Firestore.
      await addDoc(collection(db, "notes"), {
        userId: user.uid,
        userName: user.displayName,
        topic: values.topic,
        subject: values.subject,
        description: values.description,
        resourceUrl: values.url,
        resourceType: values.resourceType,
        createdAt: serverTimestamp(),
      })

      toast({
        title: "Success!",
        description: "Your resource has been shared successfully.",
      })
      form.reset()
      router.push("/notes") // Redirect to the shared resources page.
    } catch (error: any) {
        console.error("Firestore Error:", error);
        setError(`An unexpected error occurred while saving your resource. Please try again.`);
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-8 md:py-12 flex justify-center items-start">
      <Card className="max-w-3xl w-full">
        <CardHeader>
           <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <Share2 className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl md:text-3xl text-center">Share a Resource</CardTitle>
          <CardDescription className="text-center">Share a helpful YouTube video or Google Drive link with the community.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic / Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Quick Sort Algorithm Explained" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a brief description of what this resource covers..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="resourceType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Resource Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="youtube" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-2">
                            <Youtube className="h-5 w-5" /> YouTube Video
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="drive" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-2">
                            <GoogleDriveIcon />
                            Google Drive Link
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Display any submission errors in an alert box. */}
              {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Share Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full font-semibold" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Share Resource
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
