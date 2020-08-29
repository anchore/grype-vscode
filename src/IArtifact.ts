export interface IArtifact {
  name: string;
  version: string;
  type: string;
  "found-by": string[];
  locations: string[]; // note: only dir scans are supported, not image scans
}
