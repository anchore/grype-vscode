import StatusBar from "./ui/StatusBar";
import * as vscode from "vscode";
import { Grype } from "./executable/Grype";
import { ExecutableProvider } from "./executable/ExecutableProvider";
import { IConfig } from "./config";
import { Platform } from "./Platform";
import path = require("path");
import fs = require("fs");

export default class GrypeExtension {
  private readonly outputChannel: vscode.OutputChannel;
  private readonly context: vscode.ExtensionContext;
  private readonly statusBar: StatusBar;
  private readonly executableProvider: ExecutableProvider;
  private grype: Grype | null = null;

  constructor(
    context: vscode.ExtensionContext,
    config: IConfig,
    platform: Platform
  ) {
    this.context = context;
    this.outputChannel = vscode.window.createOutputChannel("Grype");
    this.statusBar = new StatusBar();
    this.showEnabledState();
    this.statusBar.showUnknown();

    this.executableProvider = new ExecutableProvider(
      context.globalState,
      config,
      context.globalStoragePath,
      platform
    );
  }

  public async activate() {
    this.initializeExtensionStorage();
    this.grype = await this.executableProvider.getGrype();
    this.register();

    // TODO: remove this line
    console.dir(this.grype);
  }

  public showEnabledState(): void {
    this.outputChannel.appendLine(
      `Grype ${this.isEnabled ? "enabled" : "disabled"}.`
    );
  }

  public showOutputMessage(message: string): void {
    this.outputChannel.appendLine(message);
  }

  public showVulnerabilities(num: number): void {
    if (num === 0) {
      this.statusBar.showNoVulnerabilities();
    } else {
      this.statusBar.showVulnerabilitiesFound(num);
    }
  }

  public handleFileChangeEvent(documentUri: vscode.Uri): void {
    console.log("grype file event:", documentUri);
    // low-pass event filter
    //    -
    // invoking grype.scan()
    // updating UI with results
  }

  public get isEnabled(): boolean {
    return !!this.context.globalState.get("isEnabled", true);
  }

  public set isEnabled(value: boolean) {
    this.context.globalState.update("isEnabled", value);
    this.showEnabledState();
  }

  private register(): void {
    vscode.commands.registerCommand("extension.enableGrype", () => {
      this.isEnabled = true;
    });

    vscode.commands.registerCommand("extension.disableGrype", () => {
      this.isEnabled = false;
    });

    // create a watcher that uses glob from grype
    // implies we ask grype (syft) for cataloger glob patterns it will use.
    const watcher = vscode.workspace.createFileSystemWatcher(
      "**/*",
      false,
      false,
      false
    );

    watcher.onDidChange((uri: vscode.Uri) => {
      this.handleFileChangeEvent(uri);
    });
  }

  private initializeExtensionStorage() {
    const { globalStoragePath } = this.context;

    const root = path.resolve(globalStoragePath, "..");

    if (!fs.existsSync(root)) {
      fs.mkdirSync(root);
    }

    if (!fs.existsSync(globalStoragePath)) {
      console.log("creating storage path...");
      fs.mkdirSync(globalStoragePath);
    }
  }
}
