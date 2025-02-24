import { Metadata } from "./google";

export type SingleScanResponse = {
  files: string[];
  folders: string[];
};

export interface File {
  name: string;
  path: string;
  fetch: string;
  metadata: Metadata | null;
}
