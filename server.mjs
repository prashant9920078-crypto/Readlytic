import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const port = Number(process.env.PORT || 3000);
const publicDir = join(process.cwd(), "public");
const works = [
  { title: "Braiding Sweetgrass", creator: "Robin Wall Kimmerer", format: "Book", themes: ["Nature", "Belonging", "Meaning"], style: "Lyrical, reflective", level: "Curious reader", note: "A meeting place for ecological knowledge, memory, and reciprocity." },
  { title: "The Dispossessed", creator: "Ursula K. Le Guin", format: "Book", themes: ["Justice", "Belonging", "Identity"], style: "Thoughtful, narrative", level: "Curious reader", note: "A quietly radical novel about freedom, solidarity, and the costs of ideal societies." },
  { title: "The Myth of Sisyphus", creator: "Albert Camus", format: "Philosophy", themes: ["Meaning", "Consciousness"], style: "Analytical, accessible", level: "Student", note: "A direct invitation to think seriously about purpose and how to live amid uncertainty." },
  { title: "A Cyborg Manifesto", creator: "Donna Haraway", format: "Essay", themes: ["Technology", "Identity", "Justice"], style: "Experimental, academic", level: "Specialist", note: "A generative challenge to fixed boundaries between human, machine, and society." },
  { title: "The Mushroom at the End of the World", creator: "Anna Lowenhaupt Tsing", format: "Book", themes: ["Nature", "History", "Belonging"], style: "Narrative, interdisciplinary", level: "Student", note: "An original way to see ecology, labor, and life in damaged landscapes." },
  { title: "The Ethics of Ambiguity", creator: "Simone de Beauvoir", format: "Philosophy", themes: ["Meaning", "Justice", "Identity"], style: "Analytical", level: "Student", note: "A humane account of freedom, responsibility, and living with other people." }
];

function rankWorks(profile) {
  const text = `${profile.interests || ""} ${profile.styles || ""} ${profile.formats || ""} ${profile.prompt || ""}`.toLowerCase();
  return works.map((work) => {
    const matched = work.themes.filter((theme) => text.includes(theme.toLowerCase()));
    const score = Math.min(96, 62 + matched.length * 12 + (text.includes(work.format.toLowerCase()) ? 7 : 0));
    return { ...work, score, why: matched.length ? `Strong overlap around ${matched.join(", ").toLowerCase()}. ${work.note}` : work.note };
  }).sort((a, b) => b.score - a.score).slice(0, 5);
}

async function aiRecommendations(profile) {
  if (!process.env.OPENAI_API_KEY) return { mode: "demo", recommendations: rankWorks(profile) };
  const catalogue = works.map(({ title, creator, format, themes, style, level, note }) => ({ title, creator, format, themes, style, level, note }));
  const prompt = `You are a thoughtful literary discovery editor. Match this reader profile to works from this catalogue only. Reader profile: ${JSON.stringify(profile)}. Catalogue: ${JSON.stringify(catalogue)}. Return strict JSON only: {"recommendations":[{"title":"exact title","score":0-100,"why":"2 concise sentences"}]}. Give at most five results. Favor meaningful fit over popularity.`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5", input: prompt })
  });
  if (!response.ok) throw new Error(`OpenAI request failed (${response.status})`);
  const data = await response.json();
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).map((part) => part.text || "").join("");
  const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
  const byTitle = new Map(works.map((work) => [work.title, work]));
  return { mode: "ai", recommendations: parsed.recommendations.map((item) => ({ ...byTitle.get(item.title), ...item })).filter((item) => item.title) };
}

const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };
createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/recommend") {
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const result = await aiRecommendations(JSON.parse(body));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }
  const path = req.url === "/" ? "index.html" : req.url.replace(/^\//, "");
  try {
    const file = await readFile(join(publicDir, path));
    res.writeHead(200, { "Content-Type": mime[extname(path)] || "application/octet-stream" });
    res.end(file);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}).listen(port, () => console.log(`Meaningful Discovery is running at http://localhost:${port}`));
