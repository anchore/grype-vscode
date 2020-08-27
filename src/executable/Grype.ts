import { spawn } from "child_process";
import fs = require("fs");
import path = require("path");

interface IGrypeReportElement {
  vulnerability: IVulnerability;
  "matched-by": Array<string>;
  artifact: IArtifact;
}

interface IVulnerability {
  id: string;
  severity: string;
  links: Array<string>;
}

interface IArtifact {
  name: string;
  version: string;
  type: string;
  "found-by": Array<string>;
}

interface IProcessResult {
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

  public async globPatterns(): Promise<string[]> {
    // TODO: the source of truth of these globs reside with grype, however,
    // there is not a command to extract these yet. This should be added in
    // a way that makes semantic sense --for now this will be hard coded as if
    // it originated from a grype command
    return [
      "**/lib/apk/db/installed", // apk
      "**/Gemfile.lock", // ruby/bundler
      "**/var/lib/dpkg/status", // dpkg
      "**/go.mod", // golang
      "**/*.jar", // java
      "**/*.war", // java
      "**/*.ear", // java
      "**/*.jpi", // java
      "**/*.hpi", // java
      "**/package-lock.json", // npm
      "**/yarn.lock", // yarn
      "**/*egg-info/PKG-INFO", // python
      "**/*dist-info/METADATA", // python
      "**/requirements.txt", // python
      "**/poetry.lock", // python
      "**/setup.py", // python
      "**/var/lib/rpm/Packages", // rpmdb
    ];
  }

  public async scan(directory: string): Promise<Array<IGrypeReportElement>> {
    console.log("scanning...");
    try {
      await this.updateDb();
      const result = await this.run(
        this.executableFilePath,
        `dir://${directory}`,
        "-o",
        "json",
        "-v"
      );
      const grypeReport: Array<IGrypeReportElement> = JSON.parse(result.stdout);
      return grypeReport;
    } catch (err) {
      throw err;
    }
  }

  private async run(cmd: string, ...args: string[]): Promise<IProcessResult> {
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

    return new Promise<IProcessResult>((resolve, reject) => {
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
