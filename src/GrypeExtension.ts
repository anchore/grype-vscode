import StatusBar from "./ui/StatusBar";
import VulnerabilityCodeLensProvider from "./ui/VulnerabilityCodeLensProvider";
import * as vscode from "vscode";
import { Grype } from "./executable/Grype";
import { ExecutableProvider } from "./executable/ExecutableProvider";
import { IGrypeFinding } from "./IGrypeFinding";
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
  private registeredCodeLenseProvider: vscode.Disposable | null = null;
  private scanReport: IGrypeFinding[] | null = null;

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

    this.registerCommands();
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

  private registerCommands(): void {
    // register all commands, use a subscription to ensure it is de-registered
    // upon the extension being unloaded
    this.context.subscriptions.push(
      vscode.commands.registerCommand("extension.enableGrypeWorkspace", () => {
        this.isWorkspaceEnabled = true;
        this.conditionallyStartWatchers();
      }),

      vscode.commands.registerCommand("extension.showReport", () => {
        if (this.scanReport) {
          // TODO: Remove this whole try/catch block when we have popups in place (w/ "Details" button)
          try {
            this.detailsView.open();
            this.detailsView.loadFindings(this.scanReport);
          } catch (err) {
            console.error(err);
          }
        }
      }),

      vscode.commands.registerCommand("extension.disableGrypeWorkspace", () => {
        this.isWorkspaceEnabled = false;
        this.watcher?.stop();
      }),

      vscode.commands.registerCommand("extension.enableGrypeGlobally", () => {
        this.isGloballyEnabled = true;
        this.conditionallyStartWatchers();
      }),

      vscode.commands.registerCommand("extension.disableGrypeGlobally", () => {
        this.isGloballyEnabled = false;
        this.watcher?.stop();
      }),

      vscode.commands.registerCommand("extension.scanWorkspace", () => {
        this.scanWorkspace();
      })
    );
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

  private registerCodeLenseProvider(results: IGrypeFinding[]): void {
    if (this.registeredCodeLenseProvider !== null) {
      // ensure any code lenses with old results are no longer used
      this.registeredCodeLenseProvider.dispose();
    }

    const docSelector = {
      scheme: "file",
    };

    const disposable = vscode.languages.registerCodeLensProvider(
      docSelector,
      new VulnerabilityCodeLensProvider(results)
    );

    this.registeredCodeLenseProvider = disposable;

    // use a subscription to ensure the provider is de-registered upon the extension being unloaded
    this.context.subscriptions.push(disposable);
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
      this.scanReport = await this.grype.scan(root);

      // update the status bar
      if (this.scanReport) {
        if (this.scanReport.length === 0) {
          this.statusBar.showNoVulnerabilities();
        } else {
          this.statusBar.showVulnerabilitiesFound(this.scanReport.length);
        }
      }

      // update all top-of-file lines for files that are in the scan results
      this.registerCodeLenseProvider(this.scanReport);
    }
  }
}
