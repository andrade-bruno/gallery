import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";

const app = express();
const PORT = 3000;
const path = "/media/bruno-andrade/HDD/photos/Lixeira"; // path.join(__dirname, "../photos");

// Enable CORS for frontend access
app.use(cors());

// Serve images statically
app.use("/images", express.static(path));

// Endpoint to get the list of images
app.get("/images", (req: Request, res: Response) => {
  fs.readdir(path, (err, files) => {
    if (err) {
      console.log("🚀 ~ fs.readdir ~ err:", err);
      return res.status(500).json({ error: "Unable to scan folder" });
    }
    const images = files.filter((file) =>
      /\.(jpg|jpeg|png|gif|heic|HEIC)$/i.test(file)
    );
    res.json(images);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
