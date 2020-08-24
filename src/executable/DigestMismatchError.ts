import { File } from "./File";

export class DigestMismatchError extends Error {
  public readonly file: File;
  public readonly expectedDigest: string;
  public readonly actualDigest: string;

  constructor(
    message: string,
    file: File,
    expectedDigest: string,
    actualDigest: string
  ) {
    super(message);
    this.file = file;
    this.expectedDigest = expectedDigest;
    this.actualDigest = actualDigest;
  }
}
