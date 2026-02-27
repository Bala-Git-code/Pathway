AI-Based Biological Pathway Simulation Framework

An AI-powered web platform that models biological pathways as directed graph networks, enables perturbation simulation, performs structural network analysis, and generates AI-driven interpretations of system-level impact.

📌 Overview

Biological pathways are complex interaction networks between genes and proteins that regulate cellular behavior. Understanding how these networks respond to perturbations (e.g., gene knockout or overexpression) is critical for systems biology research.

This project provides a computational framework that:

Models biological pathways as directed graphs

Simulates perturbations dynamically

Computes structural network metrics

Uses AI to interpret structural changes

Visualizes results interactively

The system combines graph theory, simulation modeling, and AI reasoning into a unified full-stack platform.

🚀 Key Features
🔹 Dynamic Pathway Construction

Add nodes (proteins/genes)

Define activation/inhibition edges

Real-time graph rendering

🔹 Perturbation Simulation

Node knockout simulation

Node overexpression simulation

Automatic recalculation of network structure

🔹 Structural Network Analysis

Degree centrality calculation

Node influence ranking

Connectivity analysis

Before vs after comparison

🔹 AI-Powered Interpretation

OpenAI API integration

Contextual biological reasoning

Structured analysis output

Downstream impact prediction

🔹 Interactive Visualization

Graph rendering via Cytoscape.js

Dynamic node highlighting

Visual comparison of structural changes

Graphical metric representations

🏗 Tech Stack
🖥 Frontend

React.js

Tailwind CSS

Cytoscape.js

Axios

⚙ Backend

Node.js

Express.js

MongoDB (Mongoose)

🤖 AI Integration

OpenAI API (GPT model)

🛠 Tools

VS Code

Git & GitHub

MongoDB Atlas (optional)

Postman (API testing)

🧠 System Architecture
Frontend (React + Cytoscape)
        ↓
REST API (Express.js)
        ↓
Simulation Engine (Graph Logic)
        ↓
Metric Computation
        ↓
OpenAI API (Interpretation Layer)
        ↓
Structured AI Output → Dashboard
📊 Core Functional Flow

User constructs a biological pathway.

System models it as a directed graph.

User selects a perturbation (knockout/overexpression).

Simulation engine updates graph structure.

Network metrics are recalculated.

OpenAI API interprets structural changes.

Results are displayed visually and analytically.

🔧 Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/your-username/bio-pathway-ai.git
cd bio-pathway-ai
2️⃣ Setup Backend
cd server
npm install

Create a .env file in /server:

PORT=5000
MONGO_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key

Run backend:

npm run dev
3️⃣ Setup Frontend
cd client
npm install
npm run dev
🌐 Environment Variables
Variable	Description
PORT	Backend server port
MONGO_URI	MongoDB connection string
OPENAI_API_KEY	OpenAI API key
🧪 Example Use Case

Create a signaling pathway.

Run knockout simulation on a key node.

Observe connectivity reduction.

View centrality changes.

Review AI-generated biological interpretation.

🎯 Why This Project Matters

Converts static biological diagrams into dynamic computational models.

Enables in-silico experimentation.

Bridges graph theory with AI reasoning.

Provides explainable simulation results.

⚠️ Disclaimer

This platform provides computational simulations and AI-assisted interpretations for exploratory and educational purposes. It does not replace experimental biological validation.
