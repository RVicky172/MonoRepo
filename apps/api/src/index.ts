import express from "express";
import cors from "cors";
import type { User } from "@my-monorepo/shared-types";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

const users: User[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com" },
  { id: "2", name: "Alan Turing", email: "alan@example.com" },
];

app.get("/api/users", (_req, res) => {
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
