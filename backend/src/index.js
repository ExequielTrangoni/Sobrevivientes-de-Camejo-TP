import express from "express";
import cors from "cors";
import app from


const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend anda");
});

app.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});
