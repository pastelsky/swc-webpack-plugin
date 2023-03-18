import { JsMinifyOptions } from "@swc/core";
import webpack from "webpack";
export interface MinifyPluginOptions extends JsMinifyOptions {
    sync?: boolean;
}
export declare class SWCMinifyPlugin {
    private readonly sync;
    private readonly options;
    constructor(options?: MinifyPluginOptions);
    apply(compiler: webpack.Compiler): void;
    private transformAssets;
    private processAssetsSync;
    private processAssets;
}
