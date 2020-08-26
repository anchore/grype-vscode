import * as vscode from "vscode";
import { setTimeout } from "timers";

export class WorkspaceFileWatcher {
  private watchers: Array<vscode.FileSystemWatcher> = [];
  private scheduled: boolean;
  private readonly callback: Function;
  private readonly patterns: Array<string>;

  constructor(patterns: Array<string>, callback: Function) {
    this.scheduled = false;
    this.callback = callback;
    this.patterns = patterns;
  }

  public stop() {
    console.log(`stop listening`);
    for (let watcher of this.watchers) {
      watcher.dispose();
    }
    this.watchers = [];
  }

  public start() {
    // don't enable watchers if we are already watching
    if (this.watchers.length > 0) {
      return;
    }

    const handler = (uri: vscode.Uri) => {
      this.handleFileEvent(uri);
    };

    // create a watcher that uses glob patterns from grype
    for (let pattern of this.patterns) {
      console.log(`listening for file events: ${pattern}`);

      const watcher = vscode.workspace.createFileSystemWatcher(
        pattern,
        false, // listen to create events
        false, // listen to modify events
        false // listen to delete events
      );

      this.watchers.push(watcher);

      watcher.onDidCreate(handler);
      watcher.onDidChange(handler);
      watcher.onDidDelete(handler);
    }
  }

  private handleFileEvent(documentUri: vscode.Uri): void {
    console.log("file event:", documentUri.fsPath);
    this.schedule();
  }

  private schedule() {
    if (!this.scheduled) {
      this.scheduled = true;
      // delay for one second before allowing a scan, allowing multiple events to attempt to schedule a run.
      // This also ensures that we do not allow for scans more frequent than once a second
      setTimeout(async () => {
        // note: we should allow the callback to fully return before allowing
        // anything else to be scheduled

        await this.callback();
        this.scheduled = false;
      }, 1000);
    }
  }
}
