import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local or .env
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const dbUrl =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL || "";

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your-supabase")) {
  console.error("❌ Error: Supabase environment variables missing.");
  console.log("Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSeed() {
  console.log("🚀 Starting Supabase Database Check & Seed Process...");
  console.log(`Connecting to: ${supabaseUrl}\n`);

  let missingTables = false;

  // 1. Seed Profile
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: "default_user",
      email: "personal@local",
      name: "Personal Exam User",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError && profileError.message.includes("schema cache")) {
    missingTables = true;
  }

  // 2. Seed Sample Quiz Session
  const { error: sessionError } = await supabase.from("quiz_sessions").upsert(
    {
      id: "sample-session-01",
      user_id: "default_user",
      quiz_type: "topic_wise",
      quiz_title: "Digital Logic Baseline Test",
      source_id: "digital-logic",
      mode: "practice",
      total_questions: 3,
      attempted_questions: 3,
      correct_answers: 2,
      wrong_answers: 1,
      score: 67,
      accuracy: 67,
      time_taken: 45,
    },
    { onConflict: "id" }
  );

  if (sessionError && sessionError.message.includes("schema cache")) {
    missingTables = true;
  }

  // 3. Seed Sample Wrong Question & Note
  const { error: wrongError } = await supabase.from("wrong_questions").upsert(
    {
      user_id: "default_user",
      question_id: "digital-logic-q3-001",
      wrong_count: 2,
      correct_count_after_wrong: 0,
      is_learned: false,
      priority: "High",
      personal_note:
        "I confused JK flip flop toggle condition (J=1, K=1) with SR flip flop invalid state.",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id, question_id" }
  );

  if (wrongError && wrongError.message.includes("schema cache")) {
    missingTables = true;
  }

  if (missingTables) {
    console.log("---------------------------------------------------------------");
    console.log("⚠️  SUPABASE TABLES NOT FOUND IN YOUR DATABASE YET");
    console.log("---------------------------------------------------------------");
    console.log("To create all 6 tables automatically in 30 seconds:\n");
    console.log("1️⃣ Open your Supabase SQL Editor:");
    const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
    console.log(`   👉 https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
    console.log("2️⃣ Copy the SQL code from file:");
    console.log(`   📄 supabase/schema.sql\n`);
    console.log("3️⃣ Paste into the Supabase SQL Editor and click 'Run'!\n");
    console.log("4️⃣ Run 'npm run seed' again to verify!\n");
    console.log("---------------------------------------------------------------");
  } else {
    console.log("---------------------------------------------------------------");
    console.log("🎉 SUCCESS: All Supabase tables & seed data are ready!");
    console.log("Your database is fully connected and ready for tracking exam attempts!");
    console.log("---------------------------------------------------------------");
  }
}

runSeed();
