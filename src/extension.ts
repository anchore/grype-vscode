import * as vscode from 'vscode';
import path = require("path");
import fs = require("fs");
import process = require("process");
import {https} from 'follow-redirects';
import tar = require("tar-stream");
import zlib = require('zlib');

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
		return exePath;
	}

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


	console.log('grype extension activated');

}

// this method is called when your extension is deactivated
export function deactivate() {}
