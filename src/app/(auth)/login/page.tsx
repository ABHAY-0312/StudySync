"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"

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

// Define the shape of the form data using Zod for validation.
const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

// Check if Firebase is configured by seeing if the auth object was created.
const isFirebaseConfigured = !!auth

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Initialize the form using react-hook-form and Zod for schema validation.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // This function is called when the user submits the login form.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Prevent login attempts if Firebase is not set up.
    if (!isFirebaseConfigured) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Firebase is not configured. Please check the setup.",
      });
      return;
    }
    setLoading(true)
    try {
      // Use Firebase SDK to sign the user in with their email and password.
      if (!auth) {
        toast({
          variant: "destructive",
          title: "Configuration Error",
          description: "Firebase is not configured. Please check the setup.",
        });
        setLoading(false);
        return;
      }
      await signInWithEmailAndPassword(auth, values.email, values.password)
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      })
      // Redirect to the user dashboard on successful login.
      router.push("/dashboard")
    } catch (error: any) {
      // If login fails, show an error message to the user.
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Please check your credentials and try again.",
      })
    } finally {
      // Stop the loading indicator regardless of the outcome.
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4">
          <BookOpenCheck className="h-8 w-8 text-primary" />
          <span className="font-headline font-bold text-2xl">StudySync</span>
        </Link>
        <CardTitle className="text-2xl font-headline">Login</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* If Firebase is not configured, show an error message instead of the form. */}
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
