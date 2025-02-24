import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { SingleScanResponse, File } from "./interfaces/file";
import { Metadata } from "./interfaces/google";
import heicConvert from "heic-convert";
import { platform } from "os";

const PORT = 8000;

const app = express();
app.use(cors());
app.use(express.json());

const regExp = /\.(jpg|jpeg|png|gif|heic|heif|mp4|mov|mkv)$/i;
const useHeicCoversor = false;

const drive = platform() == "linux" ? "/media/bruno-andrade/HDD" : "E:/";
const root = "/home/bruno-andrade/Desktop/selected";
const metadatasDir = `${drive}/photos`;

app.get("/image/*", async (req: Request, res: Response) => {
  const requestedPath = req.params[0] || "";
  const filePath = path.join(root, requestedPath);

  try {
    const ext = path.extname(filePath);

    if (useHeicCoversor && [".heic", ".heif"].includes(ext.toLowerCase())) {
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
    console.error(`Error processing image: ${filePath}\n`, error);
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
 * Recursively scans the directory tree starting at `dir`
 * and builds a map of metadata, keyed by the base file name (without extension).
 */
async function getMetadataMap(dir: string): Promise<Map<string, Metadata>> {
  const map = new Map<string, Metadata>();
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        // Recursively get metadata from subfolders
        const subMap = await getMetadataMap(fullPath);
        subMap.forEach((metadata, key) => {
          map.set(key, metadata);
        });
      } else if (item.isFile() && item.name.endsWith(".json")) {
        try {
          const content = await readFile(fullPath, "utf-8");
          const metadata = JSON.parse(content);
          // Use the file name without the .json extension as the key
          const baseNameWithImageType = item.name.slice(0, -5); // remove ".json"
          const baseName = path.basename(
            baseNameWithImageType,
            path.extname(baseNameWithImageType)
          );
          map.set(baseName, {
            path: fullPath,
            ...metadata,
          } as Metadata);
        } catch (error) {
          console.error(`Error reading metadata file: ${fullPath}`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error scanning for metadata files", error);
  }
  return map;
}

/**
 * Recursively scans a folder for image files.
 * For each image, it looks up the metadata in the provided metadataMap.
 */
async function getFilesWithMetadata(
  dir: string,
  metadataMap: Map<string, Metadata>
): Promise<File[]> {
  let result: File[] = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        // Process subfolders recursively
        const subFiles = await getFilesWithMetadata(fullPath, metadataMap);
        result = result.concat(subFiles);
      } else if (item.isFile() && regExp.test(item.name)) {
        const imageBaseName = path.basename(item.name, path.extname(item.name));
        const file: File = {
          path: fullPath,
          fetch: `http://localhost:${PORT}/image/${fullPath.replace(root, "")}`,
          name: item.name,
          metadata: null,
        };

        // If a metadata file was found (keyed by image base name), attach it
        if (metadataMap.has(imageBaseName)) {
          file.metadata = metadataMap.get(imageBaseName) || null;
        }

        result.push(file);
      }
    }
  } catch (error) {
    console.error(`Error reading folder: ${dir}`, error);
    throw error;
  }
  return result;
}

app.get("/all-files/:target?", async (req: Request, res: Response) => {
  const target = req.params?.target ? root + req.params?.target : root;

  try {
    const metadataMap = await getMetadataMap(metadatasDir);

    const files = await getFilesWithMetadata(target, metadataMap);
    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to scan directories" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
