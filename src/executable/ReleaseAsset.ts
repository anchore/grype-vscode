import fs = require("fs");
import { https } from "follow-redirects";
import { File } from "./File";

export class ReleaseAsset extends File {
  private readonly repositoryURL: string;
  private readonly version: string;

  constructor(
    name: string,
    version: string,
    repositoryURL: string,
    storageDirectoryPath: string
  ) {
    super(name, storageDirectoryPath);
    this.version = version;
    this.repositoryURL = repositoryURL;
  }

  public async download(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = https.get(this.url(), async (response) => {
        const archive = fs.createWriteStream(this.localPath());

        response.pipe(archive).on("close", resolve);
      });

      request.on("error", reject);
    });
  }

  private url(): string {
    return `https://${this.repositoryURL}/releases/download/v${this.version}/${this.name}`;
  }
}
