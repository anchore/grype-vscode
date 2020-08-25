import { IVulnerability } from "./IVulnerability";
import { IArtifact } from "./IArtifact";

export interface IGrypeFinding {
  vulnerability: IVulnerability;
  "matched-by": string[];
  artifact: IArtifact;
}
