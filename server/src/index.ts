import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { SingleScanResponse, File } from "./interfaces/file";
import { Metadata } from "./interfaces/google";
import heicConvert from "heic-convert";

const app = express();
const PORT = 8000;
const root = "/media/bruno-andrade/HDD/photos/";
const regExp = /\.(jpg|jpeg|png|gif|heic|heif|mp4|mov|mkv)$/i;

// Enable CORS for frontend access
app.use(cors());
app.use(express.json());

app.get("/image/*", async (req: Request, res: Response) => {
  const requestedPath = req.params[0] || "";
  const filePath = path.join(root, requestedPath);

  try {
    const ext = path.extname(filePath);
    if ([".heic", ".heif"].includes(ext.toLowerCase())) {
      // const data = await sharp(filePath).toFormat("jpeg").toBuffer();
      const inputBuffer = await fs.promises.readFile(filePath);
      const data = await heicConvert({
        buffer: inputBuffer, // the HEIC file buffer
        format: "JPEG", // output format
        quality: 1, // quality between 0 and 1
      });

      res.set("Content-Type", "image/jpeg");
      res.send(data);
      return;
    }

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send("File not found");
    }
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).send("Error processing image");
  }
});

app.get("/single-scan/:target?", (req: Request, res: Response) => {
  const target = req.params.target ? root + `${req.params.target}` : root;

  fs.readdir(target, (err, files) => {
    if (err) {
      return res.status(500).json({ error: `Unable to scan folder ${target}` });
    }

    const images = files.filter((file) => regExp.test(file));
    const folders = files.filter((file) =>
      fs.statSync(path.join(target, file)).isDirectory()
    );

    const output: SingleScanResponse = {
      files: images,
      folders,
    };
    res.json(output);
  });
});

/**
 * Recursively scans a folder for images and reads their metadata if available.
 */
async function getFilesWithMetadata(dir: string): Promise<File[]> {
  let result: File[] = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively process subfolder
        const subFolders = await getFilesWithMetadata(fullPath);
        result = result.concat(subFolders);
      } else if (regExp.test(item)) {
        const file: File = {
          path: fullPath,
          fetch: `http://localhost:${PORT}/image/${fullPath.replace(root, "")}`,
          name: item,
          metadata: null,
        };

        // Look for metadata file (same name, but .json extension)
        const metadataFile = fullPath + ".json";

        try {
          const metadata = await readFile(metadataFile, { encoding: "utf8" });
          file.metadata = JSON.parse(metadata) as Metadata;
        } catch (error) {}

        result.push(file);
      }
    }
  } catch (error) {
    console.error(`Error reading folder: ${dir}`);
    console.error(error);
    throw error;
  }

  return result;
}

app.get("/all-files/:target?", async (req: Request, res: Response) => {
  const target = req.params?.target ? root + req.params?.target : root;

  try {
    const files = await getFilesWithMetadata(target);
    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to scan directories" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
