# Image to ASCII Converter

A small browser-only image-to-ASCII tool. No Streamlit, React, Python server, database, login, or backend.

## Run locally
Open `index.html` in a modern browser. For local development, you can also use VS Code Live Server.

## Deploy on Vercel
1. Upload this folder to a GitHub repository.
2. In Vercel, import the repository.
3. Set Framework Preset to **Other**.
4. Leave Build Command and Output Directory empty (or use `.` as the output directory if prompted).
5. Deploy.

All image processing happens inside the user's browser using the Canvas API.
