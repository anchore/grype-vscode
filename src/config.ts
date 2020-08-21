export const config: IConfig = {
  grype: {
    repositoryURL: "github.com/anchore/grype",
    requiredVersion: "0.1.0-beta.6",
  },
};

export interface IConfig {
  grype: IConfigGrype;
}

interface IConfigGrype {
  repositoryURL: string;
  requiredVersion: string;
}
