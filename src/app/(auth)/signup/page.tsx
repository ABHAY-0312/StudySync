"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createUserWithEmailAndPassword, updateProfile, type User } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useToast } from "@/hooks/use-toast"
import { BookOpenCheck, Loader2, AlertTriangle } from "lucide-react"

// Defines the validation schema for the signup form.
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

// Checks if both Firebase Auth and Firestore are properly configured.
const isFirebaseConfigured = !!auth && !!db

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initializes the form with react-hook-form and Zod for validation.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  // Handles the form submission logic.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null)
    // Aborts if Firebase isn't configured, preventing runtime errors.
    if (!isFirebaseConfigured) {
       toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Firebase is not configured. Please check the setup.",
      });
      return;
    }
    
    setLoading(true);
    let user: User | null = null;

    // Step 1: Create the user account in Firebase Authentication.
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      user = userCredential.user;
      // Set the user's display name, which is stored with their auth profile.
      await updateProfile(user, {
        displayName: values.name,
      });
    } catch (error: any) {
      console.error("Authentication Error:", error);
      let description = "An unknown error occurred during account creation.";
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email is already registered. Please try logging in instead.';
      } else if (error.code === 'auth/weak-password') {
        description = 'The password is too weak. Please use at least 6 characters.';
      }
      setError(`Account Creation Failed: ${description}`);
      setLoading(false);
      return; // Stop execution if auth fails.
    }

    // Step 2: Save additional user information to a 'users' collection in Firestore.
    // This is useful for storing app-specific data not available in the auth profile.
    try {
      if (!db || !user) {
        throw new Error("Database not available or user not created.");
      }
      // Create a new document in the 'users' collection with the user's UID as the document ID.
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: values.name,
        email: values.email,
        upvoteScore: 0, // An example of extra data you might store.
      });

      toast({
        title: "Account Created!",
        description: "Welcome to StudySync! Redirecting you to the dashboard...",
      });
      router.push("/dashboard");

    } catch (error: any)
    {
      // This error often happens if Firestore security rules are not set up correctly.
      console.error("Firestore Write Error:", error);
      setError(
        "Signup Incomplete. Your account was created, but we could not save your profile. " +
        "This is almost always a Firestore Security Rules issue. " +
        "Please double-check your rules in the Firebase Console."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
         <Link href="/" className="flex items-center justify-center gap-2 mb-4">
          <BookOpenCheck className="h-8 w-8 text-primary" />
          <span className="font-headline font-bold text-2xl">StudySync</span>
        </Link>
        <CardTitle className="text-2xl font-headline">Create an account</CardTitle>
        <CardDescription>Enter your details to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* If Firebase is not configured, show a detailed error message. */}
        {!isFirebaseConfigured ? (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
                <AlertTriangle className="h-8 w-8" />
                <p className="font-semibold">Firebase Configuration Error</p>
                <p className="text-xs">
                    The app is not connected to Firebase. <strong>You must create a <code>.env.local</code> file with your Firebase project credentials.</strong> Please follow the instructions in the <code>README.md</code> file and restart the server.
                </p>
            </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Display any submission errors in a prominent alert box. */}
              {error && (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive">
                    <AlertTriangle className="h-6 w-6" />
                    <p className="font-semibold">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
