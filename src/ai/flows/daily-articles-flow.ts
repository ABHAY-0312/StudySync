'use server';
/**
 * @fileOverview A Genkit flow for generating daily educational articles.
 * This file defines the AI logic for creating short, engaging articles
 * for students on various science and computer science topics.
 *
 * - getDailyArticles - The main function exported to the application to fetch articles.
 * - DailyArticle - The TypeScript type definition for a single article.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define the Zod schema for a single article. This ensures the AI's output
// is strongly typed and matches the expected structure.
const DailyArticleSchema = z.object({
  subject: z.string().describe('The subject of the article, e.g., "Data Structures", "Operating Systems".'),
  title: z.string().describe('The compelling title of the article.'),
  summary: z.string().describe('A one-paragraph summary of the article content.'),
  emoji: z.string().describe('A single emoji that represents the article topic.')
});

// Define the Zod schema for the entire output from the AI model.
// It expects an object containing an array of articles.
const DailyArticlesOutputSchema = z.object({
    articles: z.array(DailyArticleSchema).describe('An array of 3 educational articles.')
});

// Export the TypeScript type inferred from the Zod schema for use in the frontend.
export type DailyArticle = z.infer<typeof DailyArticleSchema>;

/**
 * An asynchronous function that calls the Genkit flow and returns the generated articles.
 * It includes error handling to prevent the application from crashing if the AI call fails.
 */
export async function getDailyArticles(): Promise<DailyArticle[]> {
  try {
    const {articles} = await dailyArticlesFlow();
    return articles;
  } catch (error) {
    // Log the error for debugging purposes on the server.
    console.error("Error generating daily articles:", error);
    // Return an empty array to ensure the frontend doesn't break.
    return [];
  }
}

// Define the Genkit prompt. This is where the instructions for the AI model are specified.
const prompt = ai.definePrompt({
  name: 'dailyArticlesPrompt',
  // Tell the AI to structure its output according to our Zod schema.
  output: {schema: DailyArticlesOutputSchema},
  // The main prompt text that guides the AI's content generation.
  prompt: `You are an expert educational content creator for a student community platform.

Your task is to generate 3 interesting, concise, and engaging mini-articles on topics relevant to computer science and general science students.

The subjects should be chosen from the following list:
- Data Structures & Algorithms (DSA)
- Database Management Systems (DBMS)
- Operating Systems (OS)
- Computer Networks (CN)
- Mathematics
- Physics
- Chemistry

For each article, provide a subject, a catchy title, a one-paragraph summary, and a single representative emoji.
Ensure the content is accurate, easy to understand, and sparks curiosity.
`,
});

// Define the Genkit flow. A flow is a sequence of steps that can be executed.
// In this case, it's a simple flow that just calls our prompt.
const dailyArticlesFlow = ai.defineFlow(
  {
    name: 'dailyArticlesFlow',
    outputSchema: DailyArticlesOutputSchema,
  },
  async () => {
    // Execute the prompt and wait for the response.
    const {output} = await prompt();
    // The exclamation mark (!) asserts that the output will not be null.
    return output!;
  }
);
