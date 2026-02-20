# Bio Pathway AI

AI-enabled MERN platform for **user‑driven** biological pathway construction, dynamic perturbation simulation, graph analytics, and downstream AI‑powered biological interpretation.

## Tech Stack

- Frontend: React (Vite), React Router, Axios, Cytoscape.js, Tailwind CSS
- Backend: Node.js, Express, MongoDB (Mongoose), OpenAI SDK, dotenv, CORS, Nodemon

## Project Structure

```text
bio-pathway-ai/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GraphViewer.jsx
│   │   │   ├── PerturbationPanel.jsx
│   │   │   ├── AnalysisPanel.jsx
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   └── package.json
│
├── server/
│   ├── controllers/
│   │   ├── pathwayController.js
│   │   └── aiController.js
│   ├── models/
│   │   └── Pathway.js
│   ├── routes/
│   │   ├── pathwayRoutes.js
│   │   └── aiRoutes.js
│   ├── utils/
│   │   └── graphSimulation.js
│   ├── config/
│   │   └── db.js
│   ├── server.js
│   └── package.json
│
└── README.md
```

## Features

- Create and persist biological pathway networks (nodes + edges) starting from a blank slate
- Full CRUD API for pathways
- Simulate:
  - Node knockout (removes node and connected edges)
  - Node overexpression (increases influence score)
- Compute:
  - Degree centrality
  - Regulatory node importance ranking
- OpenAI analysis:
  - Biological impact summary
  - Key affected nodes
  - Predicted downstream pathway effects
- Cytoscape visualization:
  - Before/after perturbation comparison
  - Color coding:
    - Normal nodes: gray
    - Knocked-out node: red
    - High-centrality nodes: yellow
    - Overexpressed node: green

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas URI or local MongoDB
- OpenAI API key

## Installation

Run from the `bio-pathway-ai` root:

```bash
cd bio-pathway-ai
cd server && npm install
cd ../client && npm install
```

## Environment Setup

### Server `.env` (`server/.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
```

### Client `.env` (`client/.env`)

```env
VITE_API_URL=http://localhost:5000
```

## MongoDB Connection Setup

- For MongoDB Atlas:
  1. Create a cluster.
  2. Create a database user.
  3. Allow your IP in Network Access.
  4. Copy the connection string into `MONGO_URI`.
- For local MongoDB:
  - Example: `MONGO_URI=mongodb://127.0.0.1:27017/bio-pathway-ai`

## OpenAI Integration Setup

1. Create an API key from the OpenAI dashboard.
2. Add it to `server/.env` as `OPENAI_API_KEY`.
3. The backend uses OpenAI Responses API with:
   - System prompt:
     - `You are a computational biologist analyzing signaling pathways.`
   - User payload including:
     - Nodes
     - Edges
     - Perturbation
     - Centrality ranking
     - Regulatory node importance
4. Expected structured output:
   - `summary`
   - `keyAffectedNodes`
   - `predictedBiologicalOutcome`
   - `criticalRegulators`

## Running the Application

### Backend (development)

```bash
cd server
npm run dev
```

### Backend (production mode)

```bash
cd server
npm start
```

### Frontend

```bash
cd client
npm run dev
```

Frontend default URL:
- `http://localhost:5173`

Backend default URL:
- `http://localhost:5000`

Health check:
- `GET http://localhost:5000/health`

## API Endpoints

### Pathways

- `POST /pathways` create pathway
- `GET /pathways` list pathways
- `GET /pathways/latest` latest pathway
- `GET /pathways/:id` pathway by ID
- `PUT /pathways/:id` update pathway
- `DELETE /pathways/:id` delete pathway
- `POST /pathways/:id/perturb` run perturbation

Example perturbation payload:

```json
{
  "type": "knockout",
  "nodeId": "NODE_ID_HERE"
}
```

### AI

- `POST /ai/analyze` direct analysis endpoint

## Workflow Summary

1. Build your pathway interactively in the Workspace (nodes, edges, name).
2. Save or load pathways; each network is persisted to the database.
3. Select a node and perturbation (knockout/overexpression) once a pathway exists.
4. Run AI‑assisted simulation; results are stored and displayed with live animations.
5. Visit the Analysis view for rich metrics, comparisons, and an AI biological interpretation panel.

