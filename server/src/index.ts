import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { ImagesResponse } from "./interfaces/images";

const app = express();
const PORT = 8000;
const root = "/media/bruno-andrade/HDD/photos/";

// Enable CORS for frontend access
app.use(cors());
app.use(express.json());

// Serve images statically
app.use("/image", express.static(root));

// Endpoint to get the list of images
app.post("/images", (req: Request, res: Response) => {
  const target = req.body?.folder ? root + `${req.body?.folder}` : root;

  fs.readdir(target, (err, files) => {
    if (err) {
      console.log("🚀 ~ fs.readdir ~ err:", err);
      return res.status(500).json({ error: `Unable to scan folder ${target}` });
    }

    const images = files.filter((file) =>
      /\.(jpg|jpeg|png|gif|heic|HEIC)$/i.test(file)
    );
    const folders = files.filter((file) =>
      fs.statSync(path.join(target, file)).isDirectory()
    );

    const output: ImagesResponse = {
      files: images,
      folders,
    };
    res.json(output);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
