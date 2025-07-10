export interface DockerComposeOutput {
  services: string[];
  volumes?: string[];
  networks?: string[];
}
