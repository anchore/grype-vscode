import { WorkspaceFolder } from "vscode";

export class MultipleWorkspaceFoldersError extends Error {
  public readonly folders: ReadonlyArray<WorkspaceFolder>;

  constructor(folders: ReadonlyArray<WorkspaceFolder>) {
    const message = "Scanning multi-root workspaces is not yet supported.";
    super(message);

    this.folders = folders;
  }
}
