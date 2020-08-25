import { spawn } from "child_process";
import fs = require("fs");
import path = require("path");

interface GrypeReport {
  [index: number]: {
    vulnerability: Vulnerability;
    "matched-by": {
      [index: number]: string;
    };
    artifact: Artifact;
  };
}

interface Vulnerability {
  [index: number]: {
    id: string;
    severity: string;
    links: {
      [index: number]: string;
    };
    "cvss-v2": {
      "base-score": number;
      vector: string;
    };
  };
}

interface Artifact {
  name: string;
  version: string;
  type: string;
  "found-by": {
    [index: number]: string;
  };
}

interface ProcessResult {
  stdout: string;
  stderr: string;
}

export class Grype {
  private readonly executableFilePath: string;
  private readonly dbPath: string;

  constructor(executableFilePath: string, cachePath: string) {
    this.executableFilePath = executableFilePath;
    this.dbPath = path.resolve(cachePath, "db");
  }

  public async updateDb(): Promise<void> {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath);
    }

    try {
      await this.run(this.executableFilePath, "db", "update", "-vv");
    } catch (err) {
      console.error(err);
    }
  }

  public async scan(directory: string): Promise<GrypeReport> {
    try {
      await this.updateDb();
      const result = await this.run(
        this.executableFilePath,
        `dir://${directory}`,
        "-o",
        "json",
        "-v"
      );
      const grypeReport: GrypeReport = JSON.parse(result.stdout);
      return grypeReport;
    } catch (err) {
      throw err;
    }
  }

  private async run(cmd: string, ...args: string[]): Promise<ProcessResult> {
    const execOption = {
      env: {
        /* eslint-disable @typescript-eslint/naming-convention */
        GRYPE_DB_CACHE_DIR: this.dbPath,
        GRYPE_DB_AUTO_UPDATE: "0",
        GRYPE_CHECK_FOR_APP_UPDATE: "0",
        PATH: process.env["PATH"],
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    };

    const child = spawn(cmd, args, execOption);

    return new Promise<ProcessResult>((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (data) => (stdout += data.toString()));
      child.stderr?.on("data", (data) => (stderr += data.toString()));
      child.on("exit", () => {
        resolve({
          stdout,
          stderr,
        });
      });

      child.on("error", reject);
    });
  }
}
