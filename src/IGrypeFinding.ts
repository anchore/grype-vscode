import { IVulnerability } from "./IVulnerability";
import { IArtifact } from "./IArtifact";

export interface IGrypeFinding {
  vulnerability: IVulnerability;
  artifact: IArtifact;
}
