<div align="center">
<h1>Helmet Detection App</h1>
<p>A web application for detecting helmets in images or video streams.</p>
</div>

## Overview

This project is a React-based application that provides a user interface for helmet detection, utilizing a locally hosted deep learning model (`helmet_model (1).h5`). 

## Features

- **Local Helmet Detection:** Powered by a pre-trained deep learning model stored in the `Model/` directory.
- **Web Interface:** Easy-to-use React and Vite frontend.
- **Fast Execution:** Backend runs on Express.js to seamlessly serve the app.

## Run Locally

**Prerequisites:** 
- [Node.js](https://nodejs.org/) installed on your machine.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```
   This will start the application locally. Check the terminal output for the local server URL to access the web interface.

## Build for Production

If you want to build the optimized version of the app:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```
