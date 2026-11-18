import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(root, "questions");
const outFile = join(root, "src", "data", "bank.json");

const TYPES = new Set(["single_choice", "multiple_response", "ordering", "matching"]);

function fail(id, message) {
  throw new Error(`${id}: ${message}`);
}

function sanitize(raw) {
  const id = raw.id;
  if (!TYPES.has(raw.question_type)) fail(id, `unknown question_type ${raw.question_type}`);
  const optionIds = new Set(raw.options.map((o) => o.id));
  for (const answer of raw.correct_answers) {
    if (!optionIds.has(answer)) fail(id, `correct answer ${answer} is not an option`);
  }

  const question = {
    id,
    domain: raw.domain,
    objective: raw.objective,
    conceptId: raw.concept_id,
    type: raw.question_type,
    question: raw.question,
    options: raw.options.map((o) => ({ id: o.id, text: o.text })),
    correctAnswers: [...raw.correct_answers],
    explanation: raw.explanation,
    sources: raw.sources.map((s) => ({ title: s.title, url: s.url })),
  };

  if (raw.question_type === "matching") {
    question.prompts = raw.prompts.map((p) => ({ id: String(p.id), text: p.text }));
    question.correctMatches = Object.fromEntries(
      Object.entries(raw.correct_matches).map(([k, v]) => [String(k), v]),
    );
    for (const p of question.prompts) {
      if (!optionIds.has(question.correctMatches[p.id])) fail(id, `prompt ${p.id} has no valid match`);
    }
  }

  if (raw.question_type === "ordering" && raw.correct_answers.length !== raw.options.length) {
    fail(id, "ordering answer must place every option");
  }

  if (Array.isArray(raw.distractor_notes) && raw.distractor_notes.length > 0) {
    question.distractorNotes = raw.distractor_notes.map((n) => ({
      optionText: n.option_text,
      reason: n.reason,
      ...(n.contrasting_situation ? { contrastingSituation: n.contrasting_situation } : {}),
    }));
  }

  return question;
}

const questions = [];
for (const category of readdirSync(sourceDir).sort()) {
  const categoryDir = join(sourceDir, category);
  if (!statSync(categoryDir).isDirectory()) continue;
  for (const file of readdirSync(categoryDir).filter((f) => f.endsWith(".json")).sort()) {
    const data = JSON.parse(readFileSync(join(categoryDir, file), "utf8"));
    for (const raw of data.questions) questions.push(sanitize(raw));
  }
}

const ids = new Set(questions.map((q) => q.id));
if (ids.size !== questions.length) throw new Error("duplicate question ids");

const serialized = JSON.stringify(questions);
if (/hub_|\/#\/memory|course_reference/i.test(serialized)) {
  throw new Error("output still contains internal Hub references");
}

writeFileSync(outFile, serialized + "\n");
console.log(`wrote ${questions.length} questions to ${outFile}`);
