# Meaningful Discovery AI

A runnable MVP for discovering books, essays, philosophy, and research through thematic and stylistic fit rather than popularity.

## Run locally

1. Copy `.env.example` to `.env`.
2. Add `OPENAI_API_KEY` to enable live AI curation; without it, the app uses a local starter catalogue.
3. Run `node server.mjs` and open `http://localhost:3000`.

Keep API keys on the server: never put them in browser code.

## Next integration

Use the Airtable base for editorial curation. Add an ingestion job that analyzes new works, writes themes and style data back to Airtable, and syncs embeddings to a vector database for large-scale semantic search.
