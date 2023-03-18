"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SWCMinifyPlugin = void 0;
const core_1 = require("@swc/core");
const webpack_sources_1 = require("webpack-sources");
const { version } = require("../package.json");
const isWebpack5 = (compilation) => "processAssets" in compilation.hooks;
const isJsFile = /\.[cm]?js(\?.*)?$/i;
const pluginName = "swc-minify";
class SWCMinifyPlugin {
    constructor(options = {}) {
        this.options = { compress: true, mangle: true };
        const { sync, ...restOptions } = options;
        this.sync = sync;
        Object.assign(this.options, restOptions);
    }
    apply(compiler) {
        const meta = JSON.stringify({ name: pluginName, version, options: this.options });
        compiler.hooks.compilation.tap(pluginName, compilation => {
            compilation.hooks.chunkHash.tap(pluginName, (_, hash) => hash.update(meta));
            const tapMethod = this.sync ? "tap" : "tapPromise";
            if (isWebpack5(compilation)) {
                compilation.hooks.processAssets[tapMethod]({
                    name: pluginName,
                    stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
                    additionalAssets: true,
                }, () => this.transformAssets(compilation));
                compilation.hooks.statsPrinter.tap(pluginName, statsPrinter => {
                    statsPrinter.hooks.print
                        .for("asset.info.minimized")
                        .tap(pluginName, (minimized, { green, formatFlag }) => minimized ? green(formatFlag("minimized")) : undefined);
                });
            }
            else {
                compilation.hooks.optimizeChunkAssets[tapMethod](pluginName, () => this.transformAssets(compilation));
            }
        });
    }
    async transformAssets(compilation) {
        const { options: { devtool }, } = compilation.compiler;
        const sourcemap = this.options.sourceMap === undefined ? devtool && devtool.includes("source-map") : this.options.sourceMap;
        const assets = compilation.getAssets().filter(asset => !asset.info.minimized && isJsFile.test(asset.name));
        if (this.sync) {
            return this.processAssetsSync(assets, sourcemap, compilation);
        }
        else {
            return this.processAssets(assets, sourcemap, compilation);
        }
    }
    processAssetsSync(assets, sourcemap, compilation) {
        assets.forEach(asset => {
            const { source, map } = asset.source.sourceAndMap();
            const sourceAsString = source.toString();
            const result = core_1.minifySync(sourceAsString, {
                ...this.options,
                sourceMap: Boolean(sourcemap),
            });
            compilation.updateAsset(asset.name, sourcemap
                ? new webpack_sources_1.SourceMapSource(result.code, asset.name, result.map, sourceAsString, map, true)
                : new webpack_sources_1.RawSource(result.code), {
                ...asset.info,
                minimized: true,
            });
        });
    }
    async processAssets(assets, sourcemap, compilation) {
        await Promise.all(assets.map(async (asset) => {
            const { source, map } = asset.source.sourceAndMap();
            const sourceAsString = source.toString();
            const result = await core_1.minify(sourceAsString, {
                ...this.options,
                sourceMap: Boolean(sourcemap),
            });
            compilation.updateAsset(asset.name, sourcemap
                ? new webpack_sources_1.SourceMapSource(result.code, asset.name, result.map, sourceAsString, map, true)
                : new webpack_sources_1.RawSource(result.code), {
                ...asset.info,
                minimized: true,
            });
        }));
    }
}
exports.SWCMinifyPlugin = SWCMinifyPlugin;
