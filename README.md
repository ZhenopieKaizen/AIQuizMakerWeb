# QuizMaster AI

QuizMaster AI is a React and Express web app that creates quizzes from Microsoft Word (`.docx`) study files. Word text extraction runs in the browser, while Google Gemini quiz-generation requests run on the server so the API key is never included in the browser bundle.

## Requirements

- Node.js 24.19 (pinned in `.node-version` for consistent local and Render builds)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Run locally

1. Install dependencies:

   ```bash
    npm ci
   ```

2. Copy `.env.example` to `.env` and replace the example value with your Gemini API key:

   ```env
   GEMINI_API_KEY=your_real_key_here
   ```

3. Start the frontend and backend:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173`.

## Files to upload to GitHub

Render deploys this app from a Git repository; it does not need a ZIP upload. Commit the project source files, including `server`, `src`, `.env.example`, `.node-version`, `render.yaml`, `package.json`, `package-lock.json`, and all TypeScript config files.

Do not upload:

- `.env` (contains your secret key)
- `node_modules` (dependencies are installed during deployment)
- `dist` (generated during the Render build)
- `dist-server` (generated during the Render build)
- log files

These paths are already excluded in `.gitignore` when Git is used.

Before pushing, confirm that `.env` is not included. Your real Gemini key must be entered in Render, never committed to the repository.

## Deploy on Render

### Blueprint method

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint**.
3. Connect the GitHub repository containing this app.
4. Render reads `render.yaml` and asks for `GEMINI_API_KEY` because it is marked as a secret.
5. Paste the key into Render's environment-variable field and deploy.

The Blueprint also configures the primary Gemini model and fallback models. You do not need to add those values manually.

### Manual Web Service method

If you do not use the Blueprint, create a **Web Service** from the GitHub repository with:

- Runtime: `Node`
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`
- Environment variable: `GEMINI_API_KEY` = your real key

The server automatically uses the `PORT` value assigned by Render. Do not create a `PORT` environment variable on Render.

## Commands

```bash
npm run dev      # local frontend and backend development
npm run build    # type-check and build the frontend and backend
npm start        # serve the production build (run npm run build first)
npm run lint     # run the linter
```
