import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";

const port = 3107;
let server;

test.before(async () => {
  server = spawn(process.execPath, ["server.mjs"], {
    env: { ...process.env, PORT: String(port), OPENAI_API_KEY: "" },
    stdio: "ignore"
  });
  await new Promise((resolve) => setTimeout(resolve, 400));
});

test.after(() => server.kill());

test("returns relevant, ranked recommendations", async () => {
  const response = await fetch(`http://localhost:${port}/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interests: "nature and belonging", styles: "lyrical", formats: "book", prompt: "I want a reflective work about ecology and home." })
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.mode, "demo");
  assert.ok(result.recommendations.length >= 3);
  assert.equal(result.recommendations[0].title, "Braiding Sweetgrass");
  assert.ok(result.recommendations[0].score >= 80);
  assert.match(result.recommendations[0].why, /nature|belonging/i);
});

test("the app page is available", async () => {
  const response = await fetch(`http://localhost:${port}/`);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Meaningful Discovery/);
});
