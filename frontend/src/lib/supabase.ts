// frontend/src/lib/supabase.ts
"use client"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cihwjfeunygzjhftydpf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpaHdqZmV1bnlnempoZnR5ZHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NzQ5NTIsImV4cCI6MjA2NjM1MDk1Mn0.4SDX68Aw8MHoyGZEdaDOCdMLUwV7do2iUB1hoI-uf6M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)