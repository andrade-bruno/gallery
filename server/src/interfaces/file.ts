import { Metadata } from "./google";

export interface ImagesResponse {
  files: string[];
  folders: string[];
}

export interface File {
  name: string;
  path: string;
  fetch: string;
  metadata: Record<string, unknown> | Metadata | null;
}
