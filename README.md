# Vect

Describe a puzzle world, play it, test its rules and verify a repair.

Vect generates structured worlds with rooms, keys, gates and switches. The renderer and the playtest agent use the same gameplay engine. A verification report belongs to an exact world revision and includes a replayable trace.

## Run locally

Use Node 24 and pnpm 10.33.0.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
chmod 600 .env
pnpm dev
```

Set `OPENAI_API_KEY` in `.env` before starting the server. `OPENAI_MODEL` selects the model. Keep both settings server-side; never prefix a secret with `VITE_`. Open http://127.0.0.1:5200. The example world works without a key. Live generation and edits explain when the model is unavailable; they never substitute a sample.

## Try the full flow

1. Choose **Open example world**, then **Play**.
2. Move to the Library and collect the Access Key. Enter the Control Room, activate the Portal Switch and reach the Portal Chamber.
3. Choose **Test** to watch the agent and inspect its report.
4. Choose **Edit** and ask: “Put the access key inside the room it unlocks.” Preview the patch, then apply the revision.
5. Run **Test** again. Inspect the circular dependency, then choose **Auto-fix**.
6. A repair becomes available to commit only after a fresh agent run and replay verify the candidate. The proof view keeps the failed and repaired revisions side by side.

Use the room buttons on touchscreens, or WASD / arrow keys and E on a keyboard. **Overview** frames the whole world; **Follow player** follows your position. The blueprint fallback supports the same room controls and keyboard actions when 3D is unavailable.

Projects and reports are stored in this browser. Export a world or report before clearing browser data. Generation sends your prompt to OpenAI; edit and repair requests also send the current world. The API key stays on the server.

## Checks

```sh
pnpm gate
pnpm verify-report path/to/exported-report.json
```

The gate runs type checking, lint, formatting, tests and a production build. Verification means the recorded run passed within Vect’s implemented gameplay model. A report digest checks integrity; it is not a signature or a guarantee against every possible defect.

## Hosting and limits

The Vite app and API functions are configured for Vercel. Set the server environment variables from `.env.example` in the target project before deploying. A static-only Vite preview does not provide the model endpoints.

Generation has one corrective retry. Repair proposals are bounded to three attempts and screened for preserved intent. If the repair provider is unavailable, supported local repair rules are labelled explicitly. API rate and concurrency limits are held in memory per server instance; they are not shared across replicas. Model latency and successful generation vary by request.

Fonts are served locally. Scene geometry, theme props and illustrations are made for Vect. See [third-party credits](THIRD_PARTY.md).
