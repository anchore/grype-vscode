import * as vscode from 'vscode';
import path = require("path");
import fs = require("fs");
import process = require("process");
import {https} from 'follow-redirects';
import tar = require("tar");

function createExtensionStorage(context: vscode.ExtensionContext): string {
	if (context.globalStoragePath) {
		const root = path.resolve(context.globalStoragePath, "..");
		if (!fs.existsSync(root)) {
			fs.mkdirSync(root);
		}
		if (!fs.existsSync(context.globalStoragePath)) {
			fs.mkdirSync(context.globalStoragePath);
		}
	}
	return context.globalStoragePath;
}

function storeGrypePackage(storagePath: string): string {
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

	const binaryURL = `https://github.com/anchore/grype/releases/download/v${grypeVersion}/grype_${grypeVersion}_${platform}.tar.gz`;

	const destinationPath = path.resolve(storagePath, "archive.tar.gz");
	const file = fs.createWriteStream(destinationPath);
	const request = https.get(binaryURL, response => response.pipe(file));
	request.on("error", e => console.error(e)); // TODO: What's the best way to handle this?

	return destinationPath;
}

function untarGrypePackage(tarPath: string, destPath: string) {
	console.log("tar path:", tarPath)
	console.log("dest path:", destPath)
	tar.x(
		{
			cwd: destPath,
			file: tarPath,
		},
		// ["grype"],
	  ).then(_=> {
		// TODO: there may be some events for error handling we want to listen to
	});

	return path.resolve(destPath, "grype");
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// set the extension storage path (create if it does not exist)
	const storagePath = createExtensionStorage(context);
	const archivePath = storeGrypePackage(storagePath);
	const grypeExePath = untarGrypePackage(archivePath, storagePath);

	console.log('grype extension activated', grypeExePath);

}

// this method is called when your extension is deactivated
export function deactivate() {}
