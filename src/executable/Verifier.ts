import crypto = require("crypto");
import tar = require("tar");
import { IConfig } from "../config";
import { Platform } from "../Platform";
import { Memento } from "vscode";
import { VersionDigest } from "./VersionDigest";
import { ReleaseAsset } from "./ReleaseAsset";
import { File } from "./File";
import { DigestMismatchError } from "./DigestMismatchError";

export class Verifier {
  private static readonly requiredVersionDigestKey = "requiredVersionDigest";

  private readonly globalState: Memento;
  private readonly platform: Platform;
  private readonly storageDirectoryPath: string;
  private readonly requiredVersion: string;
  private readonly archiveFile: ReleaseAsset;
  private readonly checksumsFile: ReleaseAsset;
  private readonly grypeExecutableFile: File;

  constructor(
    globalState: Memento,
    config: IConfig,
    platform: Platform,
    storageDirectoryPath: string,
    archiveFile: ReleaseAsset,
    grypeExecutableFile: File
  ) {
    const { requiredVersion, repositoryURL } = config.grype;

    this.globalState = globalState;
    this.platform = platform;
    this.storageDirectoryPath = storageDirectoryPath;
    this.requiredVersion = requiredVersion;

    this.checksumsFile = new ReleaseAsset(
      `grype_${requiredVersion}_checksums.txt`,
      requiredVersion,
      repositoryURL,
      this.storageDirectoryPath
    );

    this.archiveFile = archiveFile;
    this.grypeExecutableFile = grypeExecutableFile;
  }

  public async verifyExecutable(executable: File): Promise<void> {
    const requiredDigest = await this.requiredExecutableDigest();
    await this.verifyFile(executable, requiredDigest);
  }

  public async downloadAndVerifyExecutable(
    executableName: string
  ): Promise<string> {
    console.log("downlading checksums file...");
    await this.checksumsFile.download();

    console.log("downloading grype archive...");
    await this.archiveFile.download();

    console.log("verifying archive...");
    await this.verifyArchive(this.archiveFile);

    console.log("removing checksums file...");
    this.checksumsFile.remove();

    console.log("extracting file from archive...");
    await tar.extract(
      {
        file: this.archiveFile.localPath(),
        cwd: this.storageDirectoryPath,
      },
      [executableName]
    );

    console.log("removing grype archive...");
    this.archiveFile.remove();

    const executableDigest = await Verifier.digest(this.grypeExecutableFile);

    await this.globalState.update(Verifier.requiredVersionDigestKey, {
      version: this.requiredVersion,
      digest: executableDigest,
    } as VersionDigest);

    return executableDigest;
  }

  private static async digest(file: File): Promise<string> {
    const hash = crypto.createHash("sha256");
    const data = await file.content();
    hash.update(data);
    return hash.digest("hex");
  }

  private async verifyArchive(archive: File): Promise<void> {
    const requiredDigest = await this.requiredArchiveDigest();
    await this.verifyFile(archive, requiredDigest);
  }

  private async verifyFile(file: File, requiredDigest: string): Promise<void> {
    const actualDigest = await Verifier.digest(file);

    if (actualDigest === requiredDigest) {
      return;
    }

    throw new DigestMismatchError(
      `digest mismatch for file "${file.localPath()}"`,
      file,
      requiredDigest,
      actualDigest
    );
  }

  private async requiredExecutableDigest(): Promise<string> {
    const requiredDigest = this.requiredExecutableDigestFromGlobalStore();

    if (requiredDigest !== null) {
      return requiredDigest;
    }

    return this.downloadAndVerifyExecutable("grype");
  }

  private requiredExecutableDigestFromGlobalStore(): string | null {
    const required = this.globalState.get<VersionDigest>(
      Verifier.requiredVersionDigestKey
    );

    if (required !== undefined && required.version === this.requiredVersion) {
      return required.digest;
    }

    return null;
  }

  private async requiredArchiveDigest(): Promise<string> {
    const escapedVersion = this.requiredVersion.split(".").join("\\.");
    const pattern = `^([0-9a-f]{64})\\s{2}grype_${escapedVersion}_${this.platform}\\.tar\\.gz$`;
    const regex = new RegExp(pattern, "m");

    const checksumsFileContent = await this.checksumsFile.content();
    const matches = regex.exec(checksumsFileContent.toString());

    if (matches?.length !== 2) {
      throw new Error("unable to find required checksum in file");
    }

    const checksum = matches[1];
    return checksum;
  }
}
