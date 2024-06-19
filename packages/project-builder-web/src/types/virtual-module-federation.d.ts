declare module 'virtual:__federation__' {
  /**
   * Advanced configuration for container locations from which modules should be resolved and loaded at runtime.
   */
  declare interface RemotesConfig {
    /**
     * Container locations from which modules should be resolved and loaded at runtime.
     */
    url: string;
    /**
     * The format of the specified external
     */
    externalType: 'url' | 'promise';
    /**
     * The name of the share scope shared with this remote.
     */
    shareScope?: string;
    /**
     * the remote format
     */
    format?: 'esm' | 'systemjs' | 'var';
    /**
     * from
     */
    from?: 'vite' | 'webpack';
  }

  declare function __federation_method_setRemote(
    name: string,
    config: RemotesConfig,
  ): void;
  declare function __federation_method_getRemote(
    name: string,
    componentName: string,
  ): Promise<unknown>;
  declare function __federation_method_unwrapDefault(module: unknown): unknown;
}
