import { IConfig } from "./config";
import { https } from 'follow-redirects';
import tar = require("tar");
import zlib = require('zlib');
import { IncomingMessage } from 'http';
import path = require("path");
import fs = require("fs");
import { Platform } from './Platform';

export class ExecutableHandler {
  private config: IConfig;
  private storagePath: string;
  private platform: string;

  constructor(config: IConfig, storagePath: string, platform: Platform) {
    this.config = config;
    this.storagePath = storagePath;
    this.platform = platform;
  }

  public async storeGrypeApp(): Promise<void> {
    if (this.alreadyStored()) {
      return;
    }

    await this.downloadGrype();
  }

  private alreadyStored(): boolean {
    const execPath = this.executablePath();

    return fs.existsSync(execPath) && fs.statSync(execPath).size > 0;
  }

  private async downloadGrype(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = https.get(this.grypeArchiveURL(), async response => {
        await this.handleGrypeArchiveStream(response);
        resolve();
      });

      request.on("error", reject);
    });
  }

  private async handleGrypeArchiveStream(response: IncomingMessage): Promise<void> {
    return new Promise((resolve, _) => { // Consider listening for errors on all streams and rejecting the promise in response
      response
        .pipe(zlib.createGunzip())
        .pipe(tar.extract({ cwd: this.storagePath } as tar.ExtractOptions, ["grype"]))
        .on("close", resolve);
    });
  }

  private executablePath(): string {
    return path.resolve(this.storagePath, "grype");
  }

  private grypeArchiveURL(): string {
    const { requiredVersion, repositoryURL } = this.config.grype;
    const archiveName = `grype_${requiredVersion}_${this.platform}.tar.gz`;

    return `https://${repositoryURL}/releases/download/v${requiredVersion}/${archiveName}`;
  }
}
