
# DuoFlow: Vercel Deployment Instructions

Follow these steps to deploy the DuoFlow AI Orchestrator:

### 1. Push to Git
Upload your project files to a GitHub, GitLab, or Bitbucket repository.

### 2. Import to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Select your DuoFlow repository.

### 3. Configure Build Settings
Vercel should automatically detect the settings, but ensure they are:
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4. Set Environment Variables
This is critical for the AI agents to function:
1. Under **Environment Variables**, add a new key: `API_KEY`.
2. Set its value to your [Google Gemini API Key](https://aistudio.google.com/app/apikey).
3. Click **Add**.

### 5. Deploy
Click the **Deploy** button. Once finished, you will have a live URL for your autonomous DevSecOps dashboard.
