
import dotenv from 'dotenv';

// Load environment variables from .env.local for the Genkit process
dotenv.config({ path: '.env.local' });

// Flows will be imported for their side effects in this file.
import './flows/daily-articles-flow';
