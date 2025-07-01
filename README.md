# 📝 Welcome to notes-manager-server! 🚀

Hello! 👋 This is a Notes Manager app that allows you to manage your notes and knowledgebase efficiently. Organize, search, and keep track of your important information with ease!

> **💡 Note for Intel Mac users:**
> If you're on an Intel chip, copy the Intel-specific Docker Compose file:
> ```bash
> cp docker-compose-intel.yml docker-compose.yml
> ```

## ⚙️ Setup Instructions

1. **Environment Variables**
   - Create a `.env` file in the root of the `notes-manager-server` directory.
   - You can copy the example from `.env-dev`:
     ```bash
     cp .env-dev .env
     ```
   - Edit the `.env` file as needed for your environment.

2. **🔑 Google Client ID**
   - You must set up a valid Google Client ID in your `.env` file for authentication to work.
   - Obtain a Google Client ID from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - Add it to your `.env` file, for example:
     ```env
     GOOGLE_CLIENT_ID=your-google-client-id-here
     ```

3. **📦 Install Dependencies**
   ```bash
   npm install
   ```

## 🐳 Running the Application

1. **Start Docker Compose**
   - Make sure Docker Desktop is running.
   - In the `notes-manager-server` directory, start the required services:
     ```bash
     docker-compose up
     ```

2. **Start All Processes**
   You need to start the following processes:
   - Server (API backend)
   - Frontend (React app)
   - Audit Worker
   - Notes Worker

   **Manually:**
   - Open a terminal for each process and run:
     ```bash
     # In notes-manager-server
     npm run start
     # In notes-manager-frontend
     npm run dev
     # In notes-manager-server (for each worker, in separate terminals)
     npm run start:audit-worker
     npm run start:notes-worker
     ```

   **Faster (Recommended): Using tasks.json**
   - If you are using VS Code, you can use the predefined tasks in `.vscode/tasks.json` to start all processes quickly.
   - Open the Command Palette (`Cmd+Shift+P`), type `Tasks: Run Task`, and select the desired task (e.g., `Start All`).
