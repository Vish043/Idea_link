# Environment Variables Setup

## Creating the `.env` file

1. Copy the `env.example` file to create your `.env` file:
   ```bash
   cp env.example .env
   ```

   Or on Windows:
   ```cmd
   copy env.example .env
   ```

2. Edit the `.env` file and set your API URL:

   **For local development:**
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

   **For production (after deploying your backend):**
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```

## Environment Variables

- `VITE_API_URL` - The base URL for your backend API
  - Default: `http://localhost:5000/api` (if not set)
  - Must start with `VITE_` to be accessible in Vite applications

## Notes

- The `.env` file is already in `.gitignore` and will not be committed to version control
- After changing `.env`, restart your development server for changes to take effect
- For production builds, set the environment variable in your hosting platform (e.g., Render, Vercel, Netlify)

