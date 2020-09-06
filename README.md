# Grype for Visual Studio Code

The Grype extension makes it easy to know when your project is using dependencies that have known security vulnerabilities.

![Grype Extension Demo](https://user-images.githubusercontent.com/5199289/92470955-29b75500-f1a5-11ea-82f6-941c9a6934f8.gif)

**IMPORTANT: Windows support is not yet available.** This extension supports only macOS and Linux.

This extension brings Grype into your Visual Studio Code experience. For the raw CLI capabilities, be sure to check out [Grype](https://github.com/anchore/grype).

## Installation

To install the extension, open the Extensions view, search for "grype" to filter results, and select the Grype extension authored by Anchore, Inc.

There is no need to install the Grype binary before installing this extension. This extension maintains its own instance of the Grype binary, so as not to interfere with any other installation of Grype.

## Overview of features

### Automatic background scanning

The extension watches for changes to files in order to proactively scan your project for vulnerabilities.

The current count of vulnerabilities is displayed in the status bar at the bottom of the window.

![Grype status bar](https://user-images.githubusercontent.com/5199289/92489715-1664b380-f1be-11ea-8e30-d94b819cf5a7.gif)

Automatic scanning is enabled by default. You can disable it for your workspace using either of these methods:

1. Click on Grype's status bar item, and select the action "Disable Automatic Scanning".
1. Launch the Command Palette, and run the command "Grype: Disable Automatic Scanning".

You can enable automatic scanning again using either the status bar item or the Command Palette.

### Vulnerability report

Get a list of your project's vulnerabilities in a sortable table, which sorts by _severity_ (highest to lowest) by default.

Learn more about a vulnerability by clicking the link in the Vulnerability column.

The report is updated automatically as scans complete.

![Grype Vulnerability Report](https://user-images.githubusercontent.com/5199289/92484713-0649d580-f1b8-11ea-915f-ab495dc3f71d.png)

### See vulnerabilities from a manifest file

The extension adds a CodeLens provider that allows you to see how many vulnerabilities the current file is contributing to your project's total count of vulnerabilities.

Clicking the vulnerability count opens the full Vulnerability Report.

![Grype CodeLens](https://user-images.githubusercontent.com/5199289/92489717-1795e080-f1be-11ea-8569-29cfe7f2828a.png)

### Manual scanning

You can always initiate a vulnerability scan manually. You can do this using either of these methods:

1. Click on Grype's status bar item, and select the action "Scan Now".
1. Launch the Command Palette, and run the command "Grype: Scan Now".

## Contributing to this project

To set up a local development environment:

1. Make sure you have VS Code installed. (If not, you can download it from here.)
1. Clone this repository.
1. Change the working directory to the repository root.
1. Run `npm install`.
1. Open the repository in Visual Studio Code.

```
$ git clone git@github.com:anchore/grype-vscode.git
[...]
$ cd grype-vscode
$ npm install
[...]
$ code .
```

To run the extension from your local code, start debugging. (Press F5, or go to the Run menu and select "Start Debugging".)

After a few seconds, a second VS Code window should open, with the words "Extension Development Host" in the window title. In this second window, the VS Code extension is installed and running! You can use this second window to open any project like you would normally.

For more information on developing Visual Studio Code Extensions, check out https://code.visualstudio.com/api.
