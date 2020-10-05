export class RootDirectoryScanError extends Error {
  constructor() {
    const message = "Scanning the root directory ('/') is not supported.";
    super(message);
  }
}
