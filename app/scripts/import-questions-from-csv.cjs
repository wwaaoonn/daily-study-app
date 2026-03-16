const { randomUUID } = require("node:crypto");
const { readFile } = require("node:fs/promises");
const { resolve } = require("node:path");

const { parse } = require("csv-parse/sync");
const { Client } = require("pg");

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile(resolve(process.cwd(), ".env.local"));
  process.loadEnvFile(resolve(process.cwd(), "app/.env"));
}

const DEFAULT_CATEGORY = "grammar";
const DEFAULT_CATEGORY_SUB = "";
const DEFAULT_DIFFICULTY = 1;
const VALID_CHOICES = new Set(["A", "B", "C", "D"]);

function parseArgs(argv) {
  const options = {
    csvPath: null,
    category: DEFAULT_CATEGORY,
    categorySub: DEFAULT_CATEGORY_SUB,
    difficulty: DEFAULT_DIFFICULTY,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--category") {
      options.category = argv[index + 1] ?? options.category;
      index += 1;
      continue;
    }

    if (value === "--category-sub") {
      options.categorySub = argv[index + 1] ?? options.categorySub;
      index += 1;
      continue;
    }

    if (value === "--difficulty") {
      const parsedDifficulty = Number.parseInt(argv[index + 1] ?? "", 10);

      if (Number.isNaN(parsedDifficulty)) {
        throw new Error("`--difficulty` must be an integer.");
      }

      options.difficulty = parsedDifficulty;
      index += 1;
      continue;
    }

    if (!options.csvPath) {
      options.csvPath = value;
      continue;
    }

    throw new Error(`Unexpected argument: ${value}`);
  }

  if (!options.csvPath) {
    throw new Error(
      "CSV path is required. Example: npm run import:questions -- '/Users/user/Downloads/questions.csv'",
    );
  }

  return options;
}

function normalizeRecord(record, index, options) {
  const prompt = record.question?.trim();
  const choiceA = record.A?.trim();
  const choiceB = record.B?.trim();
  const choiceC = record.C?.trim();
  const choiceD = record.D?.trim();
  const correctChoice = record.answer?.trim().toUpperCase();
  const explanation = record.explanation?.trim() ?? "";

  if (!prompt || !choiceA || !choiceB || !choiceC || !choiceD) {
    throw new Error(`Row ${index}: question and choices A-D are required.`);
  }

  if (!VALID_CHOICES.has(correctChoice)) {
    throw new Error(`Row ${index}: answer must be one of A, B, C, D.`);
  }

  return {
    prompt,
    choice_a: choiceA,
    choice_b: choiceB,
    choice_c: choiceC,
    choice_d: choiceD,
    correct_choice: correctChoice,
    explanation,
    category: options.category,
    category_sub: options.categorySub || null,
    difficulty: options.difficulty,
  };
}

async function loadRecords(csvPath, options) {
  const content = await readFile(resolve(csvPath), "utf8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((record, index) => normalizeRecord(record, index + 2, options));
}

async function importQuestions() {
  const options = parseArgs(process.argv.slice(2));
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to app/.env or app/.env.local.");
  }

  const normalizedQuestions = await loadRecords(options.csvPath, options);
  const dedupedQuestions = Array.from(
    new Map(normalizedQuestions.map((question) => [question.prompt, question])).values(),
  );
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const existingPromptsResult = await client.query("SELECT prompt FROM \"Question\"");
    const existingPrompts = new Set(
      existingPromptsResult.rows.map((row) => row.prompt),
    );
    const questionsToInsert = dedupedQuestions.filter(
      (question) => !existingPrompts.has(question.prompt),
    );

    await client.query("BEGIN");

    for (const question of questionsToInsert) {
      await client.query(
        `
          INSERT INTO "Question" (
            "id",
            "prompt",
            "choice_a",
            "choice_b",
            "choice_c",
            "choice_d",
            "correct_choice",
            "explanation",
            "category",
            "category_sub",
            "difficulty"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          randomUUID(),
          question.prompt,
          question.choice_a,
          question.choice_b,
          question.choice_c,
          question.choice_d,
          question.correct_choice,
          question.explanation,
          question.category,
          question.category_sub,
          question.difficulty,
        ],
      );
    }

    await client.query("COMMIT");

    console.log(`Imported ${questionsToInsert.length} questions.`);
    console.log(
      `Skipped ${normalizedQuestions.length - dedupedQuestions.length} duplicate rows inside the CSV.`,
    );
    console.log(
      `Skipped ${dedupedQuestions.length - questionsToInsert.length} questions already present in the DB.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

importQuestions().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
