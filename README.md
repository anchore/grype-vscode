# grype-vscode

This plugin will invoke Grype, a scanner that will check the contents of your current project for packages and artifacts containing known vulnerabilities. If it finds any, it will show them in the output window.

For more information about Grype, visit https://toolbox.anchore.io.

## Requirements

This plugin requires that grype is installed and within $PATH.

## Known Issues

This plugin does not yet check to make sure that grype is installed.

## Using

Make sure that grype is installed and in your path
```
% grype version
grype v0.9-fictitious
```

Clone this project and launch Visual Studio Code from within it
```
% git clone git@github.com:anchore/grype-vscode.git
[...]
% cd grype-vscode
% code .
```

Hit F5 to enter debugging mode, which will bring up a new instance of Visual Studio Code.

To trigger the plugin, bring up the command palette (View -> Command Palette...) and search for "grype".

