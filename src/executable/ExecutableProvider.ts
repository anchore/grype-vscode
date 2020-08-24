import { IConfig } from "../config";
import { Platform } from "../Platform";
import { Grype } from "./Grype";
import { Verifier } from "./Verifier";
import { Memento } from "vscode";
import { ReleaseAsset } from "./ReleaseAsset";
import { File } from "./File";
import { DigestMismatchError } from "./DigestMismatchError";

export class ExecutableProvider {
  private static readonly executableName = "grype";

  private readonly globalState: Memento;
  private readonly config: IConfig;
  private readonly storageDirectoryPath: string;
  private readonly platform: Platform;
  private readonly archiveFile: ReleaseAsset;
  private readonly executableFile: File;

  constructor(
    globalState: Memento,
    config: IConfig,
    storageDirectoryPath: string,
    platform: Platform
  ) {
    this.globalState = globalState;
    this.config = config;
    this.storageDirectoryPath = storageDirectoryPath;
    this.platform = platform;

    const { requiredVersion, repositoryURL } = config.grype;
    this.archiveFile = new ReleaseAsset(
      `grype_${requiredVersion}_${platform}.tar.gz`,
      requiredVersion,
      repositoryURL,
      storageDirectoryPath
    );
    this.executableFile = new File(
      ExecutableProvider.executableName,
      storageDirectoryPath
    );
  }

  public async getGrype(): Promise<Grype> {
    const verifier = new Verifier(
      this.globalState,
      this.config,
      this.platform,
      this.storageDirectoryPath,
      this.archiveFile,
      this.executableFile
    );

    // See if we already have a usable version of grype.
    if (this.executableFile.exists()) {
      console.log("found grype executable");
      try {
        console.log("verifying grype executable...");
        await verifier.verifyExecutable(this.executableFile);

        return this.newGrype();
      } catch (err) {
        if (err instanceof DigestMismatchError) {
          console.log(err.message);
          console.log(
            "grype executable has incorrect contents; removing file..."
          );
          this.executableFile.remove();
        } else {
          throw err;
        }
      }
    } else {
      console.log("grype executable not present");
    }

    // If we don't already have the right version of grype, we'll need to get it.
    await verifier.downloadAndVerifyExecutable(
      ExecutableProvider.executableName
    );

    return this.newGrype();
  }

  private newGrype(): Grype {
    return new Grype(this.executableFile.localPath());
  }
}
