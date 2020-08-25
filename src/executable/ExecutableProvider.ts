import * as vscode from "vscode";
import { IConfig } from "../config";
import { Platform } from "../Platform";
import { Grype } from "./Grype";
import { Verifier } from "./Verifier";
import { ReleaseAsset } from "./ReleaseAsset";
import { File } from "./File";
import { DigestMismatchError } from "./DigestMismatchError";

export class ExecutableProvider {
  private static readonly executableName = "grype";

  private readonly context: vscode.ExtensionContext;
  private readonly config: IConfig;
  private readonly platform: Platform;
  private readonly archiveFile: ReleaseAsset;
  private readonly executableFile: File;

  constructor(
    context: vscode.ExtensionContext,
    config: IConfig,
    platform: Platform
  ) {
    this.context = context;
    this.config = config;
    this.platform = platform;

    const { requiredVersion, repositoryURL } = config.grype;
    this.archiveFile = new ReleaseAsset(
      `grype_${requiredVersion}_${platform}.tar.gz`,
      context.globalStoragePath,
      requiredVersion,
      repositoryURL
    );
    this.executableFile = new File(
      ExecutableProvider.executableName,
      context.globalStoragePath
    );
  }

  public async getGrype(): Promise<Grype> {
    const verifier = new Verifier(
      this.context,
      this.config,
      this.platform,
      this.archiveFile,
      this.executableFile
    );

    // See if we already have a usable version of grype.
    if (this.executableFile.exists()) {
      console.log("found grype executable");
      try {
        await verifier.verifyExecutable(this.executableFile);

        return this.newGrype();
      } catch (err) {
        if (err instanceof DigestMismatchError) {
          console.log("grype executable has incorrect digest");
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
    return new Grype(
      this.executableFile.localPath(),
      this.context.globalStoragePath
    );
  }
}
