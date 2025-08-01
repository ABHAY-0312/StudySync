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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// A predefined list of subjects for the user to choose from.
const subjects = ["DSA", "DBMS", "OS", "CN", "Maths", "Physics", "Chemistry", "Other"]

// Schema for validating the doubt form data.
const formSchema = z.object({
  subject: z.string().min(1, { message: "Please select a subject." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
})

export default function AskDoubtPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null);

  // Initialize the form using react-hook-form and our Zod schema.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      description: "",
    },
  })

  // While the user's authentication status is loading, show a spinner.
  if (authLoading) {
    return <div className="flex justify-center items-center h-full py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  // If the user is not logged in, redirect them to the login page.
  // This is a crucial step to ensure we know who is posting the doubt.
  if (!user) {
    router.push("/login")
    toast({
      variant: "destructive",
      title: "Authentication Required",
      description: "You need to be logged in to ask a doubt.",
    })
    return null
  }

  // This function handles the logic when the form is submitted.
  async function onSubmit(values: z.infer<typeof formSchema>>) {
    // Double-check user and db objects to prevent errors.
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
      // Add a new document to the 'doubts' collection in Firestore.
      await addDoc(collection(db, "doubts"), {
        userId: user.uid, // Store the user's ID to link the doubt to them.
        userName: user.displayName, // Store the display name for easy access.
        subject: values.subject,
        description: values.description,
        createdAt: serverTimestamp(), // Use a server timestamp for accurate sorting.
        isResolved: false, // Default status for a new doubt.
      })

      toast({
        title: "Success!",
        description: "Your doubt has been posted successfully.",
      })
      form.reset() // Clear the form fields.
      router.push("/doubts") // Redirect to the doubts feed.
    } catch (error: any) {
      console.error("Firebase Error:", error);
      setError("Post Failed: An unexpected error occurred. Please check the console for details.");
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-8 md:py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl md:text-3xl">Ask a Doubt</CardTitle>
          <CardDescription>Post your question and get help from the community.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <FormLabel>Doubt Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your doubt in detail..."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* If there's an error on submission, display it in an alert. */}
              {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Post Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full font-semibold" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Doubt
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
