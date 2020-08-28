import StatusBar from "./ui/StatusBar";
import * as vscode from "vscode";
import { Grype } from "./executable/Grype";
import { ExecutableProvider } from "./executable/ExecutableProvider";
import { IConfig } from "./config";
import { Platform } from "./Platform";
import { WorkspaceFileWatcher } from "./WorkspaceFileWatcher";
import path = require("path");
import fs = require("fs");
import { DetailsView } from "./ui/DetailsView";

export default class GrypeExtension {
  private readonly outputChannel: vscode.OutputChannel;
  private readonly context: vscode.ExtensionContext;
  private readonly statusBar: StatusBar;
  private readonly executableProvider: ExecutableProvider;
  private readonly detailsView: DetailsView;
  private grype: Grype | null = null;
  private watcher: WorkspaceFileWatcher | null = null;

  constructor(
    context: vscode.ExtensionContext,
    config: IConfig,
    platform: Platform
  ) {
    this.context = context;
    this.outputChannel = vscode.window.createOutputChannel("Grype");
    this.statusBar = new StatusBar();
    this.statusBar.hide();
    this.executableProvider = new ExecutableProvider(context, config, platform);
    this.detailsView = new DetailsView(context);
  }

  public async activate(): Promise<void> {
    this.initializeExtensionStorage();
    this.grype = await this.executableProvider.getGrype();

    const patterns = await this.grype?.globPatterns();
    this.watcher = new WorkspaceFileWatcher(
      patterns,
      this.scanWorkspace.bind(this)
    );

    this.register();
    this.conditionallyStartWatchers();
  }

  public showOutputMessage(message: string): void {
    this.outputChannel.appendLine(message);
  }

  public get isWorkspaceEnabled(): boolean {
    return this.context.workspaceState.get<boolean>("isWorkspaceEnabled", true);
  }

  public set isWorkspaceEnabled(value: boolean) {
    this.context.workspaceState.update("isWorkspaceEnabled", value);
  }

  public get isGloballyEnabled(): boolean {
    return this.context.globalState.get<boolean>("isGloballyEnabled", true);
  }

  public set isGloballyEnabled(value: boolean) {
    this.context.globalState.update("isGloballyEnabled", value);
  }

  private initializeExtensionStorage(): void {
    const { globalStoragePath } = this.context;
    const root = path.resolve(globalStoragePath, "..");

    if (!fs.existsSync(root)) {
      fs.mkdirSync(root);
    }

    if (!fs.existsSync(globalStoragePath)) {
      fs.mkdirSync(globalStoragePath);
    }
  }

  private register(): void {
    vscode.commands.registerCommand("extension.enableGrypeWorkspace", () => {
      this.isWorkspaceEnabled = true;
      this.conditionallyStartWatchers();
    });

    vscode.commands.registerCommand("extension.disableGrypeWorkspace", () => {
      this.isWorkspaceEnabled = false;
      this.watcher?.stop();
    });

    vscode.commands.registerCommand("extension.enableGrypeGlobally", () => {
      this.isGloballyEnabled = true;
      this.conditionallyStartWatchers();
    });

    vscode.commands.registerCommand("extension.disableGrypeGlobally", () => {
      this.isGloballyEnabled = false;
      this.watcher?.stop();
    });

    vscode.commands.registerCommand("extension.scanWorkspace", async () => {
      await this.scanWorkspace();
    });
  }

  private conditionallyStartWatchers(): void {
    // we want to automatically trigger scans for any file event in the workspace automatically
    // only if this workspace is explicitly enabled and overall globally enabled
    if (this.isGloballyEnabled && this.isWorkspaceEnabled) {
      // perform an initial scan on startup
      this.scanWorkspace();

      // watch for changes and trigger a rescan
      this.watcher?.start();
    }
  }

  private async scanWorkspace(): Promise<void> {
    const root = vscode.workspace.rootPath;
    if (!root) {
      console.error("no workspace path defined");
      return;
    }

    if (this.grype) {
      this.statusBar.showScanning();

      // TODO: Catch errors and notify user of unsuccessful scan somehow
      const result = await this.grype.scan(root);

      // TODO: Remove this whole try/catch block when we have popups in place (w/ "Details" button)
      try {
        this.detailsView.open();
        this.detailsView.loadFindings(result);
      } catch (err) {
        console.error(err);
      }

      // update the status bar
      if (result) {
        if (result.length === 0) {
          this.statusBar.showNoVulnerabilities();
        } else {
          this.statusBar.showVulnerabilitiesFound(result.length);
        }
      }
    }
  }
}
