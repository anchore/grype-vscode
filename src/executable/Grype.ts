export class Grype {
  private readonly executableFilePath: string;

  constructor(executableFilePath: string) {
    this.executableFilePath = executableFilePath;
  }

  public async version() {
    // remove this line
    console.log(this.executableFilePath);

    // invoke the grype exe and get the current version
    // calls exec
  }

  // public async scan(directory: string) {
  //   // invoke the grype exe and scan a given directory
  //   // resolves the grype exe by downloading or using whats there
  //   // calls exec
  // }

  // private async exec(cmd: string) {}
}
