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
import { VulnerabilityReportView } from "./ui/VulnerabilityReportView";
import { VulnerabilityReportSerializer } from "./ui/VulnerabilityReportSerializer";
import { ExecutableNotFoundError } from "./executable/ExecutableNotFoundError";
import { ExitCodeNonZeroError } from "./executable/ExitCodeNonZeroError";
import { StatusBarQuickPick } from "./ui/StatusBarQuickPick";

export default class GrypeExtension {
  private static readonly isAutomaticScanningEnabledKey =
    "isAutomaticScanningEnabled";
  private readonly context: vscode.ExtensionContext;
  private readonly statusBar: StatusBar;
  private readonly executableProvider: ExecutableProvider;
  private readonly vulnerabilityReportView: VulnerabilityReportView;
  private grype: Grype | null = null;
  private watcher: WorkspaceFileWatcher | null = null;
  private registeredCodeLensProvider: vscode.Disposable | null = null;
  private scanReport: IGrypeFinding[] | null = null;

  constructor(
    context: vscode.ExtensionContext,
    config: IConfig,
    platform: Platform
  ) {
    this.context = context;
    this.statusBar = new StatusBar(() => this.isAutomaticScanningEnabled);
    this.executableProvider = new ExecutableProvider(context, config, platform);
    this.vulnerabilityReportView = new VulnerabilityReportView(
      context,
      () => this.scanReport
    );
  }

  public async activate(): Promise<void> {
    this.initializeExtensionStorage();
    this.grype = await this.executableProvider.getGrype();

    await this.initializeWatcher();

    this.registerCommands();
    this.conditionallyStartWatchers();

    const vulnerabilityReportSerializer = new VulnerabilityReportSerializer(
      this.vulnerabilityReportView,
      () => this.scanReport
    );

    vscode.window.registerWebviewPanelSerializer(
      "vulnerabilityReportView",
      vulnerabilityReportSerializer
    );
  }

  private get isAutomaticScanningEnabled(): boolean {
    return this.context.workspaceState.get<boolean>(
      GrypeExtension.isAutomaticScanningEnabledKey,
      true
    );
  }

  private set isAutomaticScanningEnabled(value: boolean) {
    this.context.workspaceState
      .update(GrypeExtension.isAutomaticScanningEnabledKey, value)
      .then(() => {
        this.statusBar.updateEnabledState();
      });
  }

  private get areScanResultsAvailable(): boolean {
    return this.scanReport ? true : false;
  }

  private async initializeWatcher(): Promise<void> {
    if (!this.watcher && this.grype) {
      const patterns = await this.grype.globPatterns();
      this.watcher = new WorkspaceFileWatcher(
        patterns,
        this.scanWorkspace.bind(this)
      );
    }
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
      vscode.commands.registerCommand(
        "extension.launchStatusBarQuickPick",
        this.launchStatusBarQuickPick.bind(this)
      ),

      vscode.commands.registerCommand(
        "extension.openVulnerabilityReport",
        this.openVulnerabilityReport.bind(this)
      ),

      vscode.commands.registerCommand(
        "extension.enableAutomaticScanning",
        this.enableAutomaticScanning.bind(this)
      ),

      vscode.commands.registerCommand(
        "extension.disableAutomaticScanning",
        this.disableAutomaticScanning.bind(this)
      ),

      vscode.commands.registerCommand(
        "extension.scanWorkspace",
        this.manualScan.bind(this)
      )
    );
  }

  private async openVulnerabilityReport(): Promise<void> {
    if (this.scanReport) {
      try {
        await this.vulnerabilityReportView.open(this.scanReport);
      } catch (err) {
        console.error(err);
      }
    } else {
      const scanAction = "Scan Now";

      const actionSelected = await vscode.window.showWarningMessage(
        "No vulnerability report available because the workspace hasn't been scanned yet.",
        scanAction
      );

      if (actionSelected === scanAction) {
        this.manualScan();
      }
    }
  }

  private async enableAutomaticScanning(): Promise<void> {
    this.isAutomaticScanningEnabled = true;

    await this.initializeWatcher();
    this.conditionallyStartWatchers();
  }

  private disableAutomaticScanning(): void {
    this.isAutomaticScanningEnabled = false;
    this.watcher?.stop();
  }

  private async launchStatusBarQuickPick(): Promise<void> {
    const selectionHandler = (item: vscode.QuickPickItem) => {
      switch (item) {
        case StatusBarQuickPick.enableAutomaticScanningOption:
          this.enableAutomaticScanning();
          break;
        case StatusBarQuickPick.disableAutomaticScanningOption:
          this.disableAutomaticScanning();
          break;
        case StatusBarQuickPick.scanWorkspaceOption:
          this.manualScan();
          break;
        case StatusBarQuickPick.showVulnerabilityReportOption:
          this.vulnerabilityReportView.open();
          break;
      }
    };

    const quickPick = new StatusBarQuickPick(
      this.isAutomaticScanningEnabled,
      this.areScanResultsAvailable,
      selectionHandler.bind(this)
    );

    quickPick.launch();
  }

  private async manualScan(): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Scanning workspace...",
        cancellable: false,
      },
      async () => {
        await this.scanWorkspace();
      }
    );

    if (this.scanReport) {
      const vulnerabilitiesCount = this.scanReport.length;

      if (vulnerabilitiesCount >= 1) {
        const detailsAction = "Open Vulnerability Report";

        const actionSelected = await vscode.window.showWarningMessage(
          `Found ${this.scanReport.length} vulnerabilities in workspace.`,
          detailsAction
        );

        if (actionSelected === detailsAction) {
          await this.vulnerabilityReportView.open();
        }
      } else {
        vscode.window.showInformationMessage("No vulnerabilities found.");
      }
    }
  }

  private conditionallyStartWatchers(): void {
    // we want to automatically trigger scans for any file event in the workspace automatically
    // only if this workspace is explicitly enabled
    if (this.isAutomaticScanningEnabled) {
      // perform an initial scan on startup
      this.scanWorkspace();

      // watch for changes and trigger a rescan
      if (this.watcher) {
        this.watcher.start();
      }
    }
  }

  private registerCodeLensProvider(results: IGrypeFinding[]): void {
    if (this.registeredCodeLensProvider !== null) {
      // ensure any code lenses with old results are no longer used
      this.registeredCodeLensProvider.dispose();
    }

    const docSelector = {
      scheme: "file",
    };

    const disposable = vscode.languages.registerCodeLensProvider(
      docSelector,
      new VulnerabilityCodeLensProvider(results)
    );

    this.registeredCodeLensProvider = disposable;

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
      try {
        this.scanReport = await this.grype.scan(root);
      } catch (err) {
        this.handleScanError(err);
        return;
      }

      // update the status bar
      if (this.scanReport.length === 0) {
        this.statusBar.showNoVulnerabilities();
      } else {
        this.statusBar.showVulnerabilitiesFound(this.scanReport.length);
      }

      await this.vulnerabilityReportView.setFindings(this.scanReport);

      // update all top-of-file lines for files that are in the scan results
      this.registerCodeLensProvider(this.scanReport);
    }
  }

  private handleScanError(err: Error): void {
    this.statusBar.showError();

    if (err instanceof ExecutableNotFoundError) {
      vscode.window.showErrorMessage(
        "Unable to find the grype executable. To fix this, try reactivating the extension by reloading the window."
      );

      return;
    }

    if (err instanceof ExitCodeNonZeroError) {
      vscode.window.showErrorMessage(
        `Grype exited with an error: ${err.message}`
      );

      return;
    }

    vscode.window.showErrorMessage(
      `Unable to run scan due to unexpected error: ${err}`
    );
  }
}
