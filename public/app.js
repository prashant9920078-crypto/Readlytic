const form = document.querySelector("#profile-form");
const results = document.querySelector("#results");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  results.innerHTML = "<p class='loading'>Finding meaningful connections…</p>";
  const profile = Object.fromEntries(["interests", "styles", "formats", "prompt"].map((id) => [id, document.querySelector(`#${id}`).value]));
  try {
    const response = await fetch("/api/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    results.innerHTML = `<p class="mode">${data.mode === "ai" ? "AI-curated matches" : "Starter catalogue matches"}</p><h2>For you</h2>${data.recommendations.map((work) => `<article><div class="score">${work.score}% fit</div><h3>${work.title}</h3><p class="byline">${work.creator} · ${work.format}</p><div class="tags">${(work.themes || []).map((theme) => `<span>${theme}</span>`).join("")}</div><p>${work.why}</p></article>`).join("")}`;
  } catch (error) { results.innerHTML = `<p class="error">${error.message}. Check your API key or try again.</p>`; }
});
