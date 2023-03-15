import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yzxsiqwrmigznhixkeyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6eHNpcXdybWlnem5oaXhrZXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg1NDk3NTUsImV4cCI6MTk5NDEyNTc1NX0.95sIDd00U5_Fg6rOy4XeDYNN4eUVY1mVkvlmDoYGUHs"
);

export default supabase;
