// filepath: /home/abhishek/Desktop/Musitech_CRM/musitech-launchpad/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jortjktkxjrspxhltdfj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcnRqa3RreGpyc3B4aGx0ZGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3ODkzMjUsImV4cCI6MjA3MjM2NTMyNX0.o-OFw155Mohd3pa726pzm9UTNnHoxTqMhZ9dNoi1u4w';

export const supabase = createClient(supabaseUrl, supabaseKey);