export class NoWorkspaceFolderError extends Error {
  constructor() {
    const message = "No workspace folder was found.";
    super(message);
  }
}
