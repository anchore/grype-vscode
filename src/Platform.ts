import process = require("process");

export enum Platform {
  darwin = "darwin_amd64",
  linux = "linux_amd64",
}

export function determinePlatform(): Platform {
  switch (process.platform) {
    case "darwin":
      return Platform.darwin;
    case "linux":
      return Platform.linux;
    default:
      throw new Error("unsupported platform");
  }
}
