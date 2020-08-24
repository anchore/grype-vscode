import fs = require("fs");
import path = require("path");

export class File {
  public readonly name: string;
  protected readonly storageDirectoryPath: string;

  constructor(name: string, storageDirectoryPath: string) {
    this.name = name;
    this.storageDirectoryPath = storageDirectoryPath;
  }

  public localPath(): string {
    return path.resolve(this.storageDirectoryPath, this.name);
  }

  public remove(): void {
    console.log(`removing ${this.name}...`);
    fs.unlinkSync(this.localPath());
  }

  public exists(): boolean {
    return fs.existsSync(this.localPath());
  }

  public async content(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.localPath(), (err, data) => {
        if (err !== null) {
          reject(err);
          return;
        }

        resolve(data);
      });
    });
  }
}
