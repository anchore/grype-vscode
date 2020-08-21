import * as vscode from 'vscode';
import path = require("path");
import fs = require("fs");
import process = require("process");
import {https} from 'follow-redirects';
import tar = require("tar-stream");
import zlib = require('zlib');
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

function storeGrypeApp(storagePath: string): string {
	const grypeVersion = "0.1.0-beta.6";
	let platform: string;
	switch (process.platform) {
		case "darwin":
			platform = "darwin_amd64";
			break;
		case "linux":
			platform = "linux_amd64";
			break;

		default:
			platform = ""; // TODO: This should be a fatal error — how do we want to handle that?
			break;
	}

	const exePath = path.resolve(storagePath, "grype");
	if (fs.existsSync(exePath)) {
		console.log("grype already exists locally")
		return exePath;
	}
	console.log("downloading grype")

	const archiveName = `grype_${grypeVersion}_${platform}.tar.gz`
	const binaryURL = `https://github.com/anchore/grype/releases/download/v${grypeVersion}/${archiveName}`;

	const request = https.get(binaryURL, response => {

		var writeStream = fs.createWriteStream(exePath);
		var extract = tar.extract();

		extract.on('entry', (header, stream, next) => {

			stream.on('data', (chunk) => {
				if (header.name === 'grype') {
					writeStream.write(chunk);
				}
			});

			stream.on('end', () => {
				next();
			});

			stream.resume();
		});

		extract.on('finish', () => {
			writeStream.end();
			fs.chmodSync(exePath, 0o755);
		});

		response
			.pipe(zlib.createGunzip())
			.pipe(extract);

	});
	request.on("error", e => console.error(e)); // TODO: What's the best way to handle this?

	return exePath;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// set the extension storage path (create if it does not exist)
	const storagePath = createExtensionStorage(context);
	const exePath = storeGrypeApp(storagePath);

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