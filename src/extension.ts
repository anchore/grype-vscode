import * as vscode from 'vscode';
import path = require("path");
import fs = require("fs");
import { config } from "./config";
import { ExecutableHandler } from "./ExecutableHandler";
import { determinePlatform } from './Platform';
import StatusBar from "./status-bar";


function createExtensionStorage(context: vscode.ExtensionContext): string {
	if (context.globalStoragePath) {

		const root = path.resolve(context.globalStoragePath, "..");
		if (!fs.existsSync(root)) {
			fs.mkdirSync(root);
		}
		if (!fs.existsSync(context.globalStoragePath)) {
			console.log("creating storage path");
			fs.mkdirSync(context.globalStoragePath);
		}
	}
	return context.globalStoragePath;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// set the extension storage path (create if it does not exist)
	const storagePath = createExtensionStorage(context);
	const execHandler = new ExecutableHandler(config, storagePath, determinePlatform());

  	execHandler.storeGrypeApp().then(() => {
		console.log("grype extension activated");
	}).catch(
		console.error
	);

	const extension: GrypeExtension = new GrypeExtension(context);

	vscode.commands.registerCommand("extension.enableGrype", () => {
		extension.isEnabled = true;
		extension.showVulnerabilities(12)
	});

	vscode.commands.registerCommand("extension.disableGrype", () => {
		extension.isEnabled = false;
		extension.showVulnerabilities(0)
	});

	const watcher: vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher("**/*", false, false, false);

	watcher.onDidChange((uri: vscode.Uri) => {
		extension.eventHandler(uri);
	});

	console.log('grype extension activated');

}

// this method is called when your extension is deactivated
export function deactivate() {}


class GrypeExtension {
	private _outputChannel: vscode.OutputChannel;
	private _context: vscode.ExtensionContext;
	private _statusBar: StatusBar;

	constructor(context: vscode.ExtensionContext) {
		this._context = context;
		this._outputChannel = vscode.window.createOutputChannel("Grype");
		this._statusBar = new StatusBar();
		this.showEnabledState();
		this._statusBar.showUnknown();
	}


	public showEnabledState(): void {
		this._outputChannel.appendLine(`Grype ${this.isEnabled ? "enabled" : "disabled"}.`);
	}


	public showOutputMessage(message: string): void {
		this._outputChannel.appendLine(message);
	}


	public showVulnerabilities(num: number): void {
		if (num === 0) {
			this._statusBar.showNoVulnerabilities();
		} else {
			this._statusBar.showVulnerabilitiesFound(num);
		}
	}

	public eventHandler(documentUri: vscode.Uri): void {
		console.log("grype file event:", documentUri);
	}


	public get isEnabled(): boolean {
		return !!this._context.globalState.get("isEnabled", true);
	}
	public set isEnabled(value: boolean) {
		this._context.globalState.update("isEnabled", value);
		this.showEnabledState();
	}

}
