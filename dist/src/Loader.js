"use strict";
var loaderUtils = require('loader-utils');
var os = require('os');
var fs = require('fs');
var path = require('path');
var options_1 = require('./options');
var RouteModule_1 = require('./RouteModule');
var Loader = (function () {
    function Loader(webpack) {
        this.webpack = webpack;
    }
    Loader.prototype.replace = function (source) {
        //TODO: Move this regex async chaos into AST
        var LOAD_CHILDREN_RE = /loadChildren[\s]*:[\s]*['|"](.*?)['|"]/gm;
        var promises = [];
        var match = LOAD_CHILDREN_RE.exec(source);
        while (match) {
            var p = this.replaceSource(match[0], match[1])
                .then(function (result) {
                source = source.replace(result.match, result.replacement);
                return Object.assign(result, {
                    source: source
                });
            });
            promises.push(p);
            match = LOAD_CHILDREN_RE.exec(source);
        }
        if (promises.length > 0) {
            return Promise.all(promises);
        }
        else {
            return Promise.resolve(undefined);
        }
    };
    Loader.prototype.resolve = function (context, resourceUri) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.webpack.resolve(context, resourceUri, function (err, fullPath) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(fullPath);
                }
            });
        });
    };
    Loader.prototype.replaceSource = function (match, loadChildrenPath) {
        var _this = this;
        this.query = Object.assign({}, options_1.DEFAULT_OPTIONS, loaderUtils.parseQuery(this.webpack.query));
        var route = new RouteModule_1.RouteDestination(loadChildrenPath, this.webpack.resourcePath, this.query);
        var codeGen = Loader.LOADER_CODEGEN_MAP.get(route.options.loader);
        if (!codeGen) {
            return Promise.reject(new Error("ng-router-loader - Invalid code generator \"" + route.options.loader + "\""));
        }
        var context = !route.isRawRelative || !route.isCompiled
            ? path.dirname(this.webpack.resourcePath)
            : path.dirname(this.genDirToSourceTree(this.webpack.resourcePath));
        return this.resolve(context, route.rawFilePath)
            .then(function (filePath) {
            var moduleName = route.moduleName;
            // update the file path for non-ngfactory files
            if (_this.query.aot) {
                filePath = _this.sourceTreeToGenDir(filePath);
                filePath = filePath.substr(0, filePath.lastIndexOf('.'));
                if (route.options.bySymbol) {
                    filePath = _this.trackSymbolRootDecl(filePath, route.moduleName);
                }
                filePath = filePath + _this.query.moduleSuffix;
                moduleName = moduleName + _this.query.factorySuffix;
            }
            else {
                filePath = filePath.substr(0, filePath.lastIndexOf('.'));
            }
            filePath = _this.normalize(filePath);
            var replacement = codeGen(filePath, moduleName, _this.query, route.options);
            return {
                debug: typeof _this.query.debug !== 'boolean' ? _this.webpack.debug : _this.query.debug,
                filePath: filePath,
                moduleName: moduleName,
                resourceQuery: route.options,
                source: undefined,
                match: match,
                replacement: replacement
            };
        });
    };
    Loader.prototype.normalize = function (filePath) {
        var normalizedPath = path.normalize(filePath);
        if (os.platform() === 'win32') {
            normalizedPath = normalizedPath.replace(/\\/g, '\\\\');
        }
        return normalizedPath;
    };
    Loader.prototype.trackSymbolRootDecl = function (absPath, moduleName) {
        var summarySuffix = '.ngsummary.json';
        if (absPath.endsWith(summarySuffix)) {
            var summary_1 = require(absPath);
            var symbols = summary_1.symbols
                .filter(function (s) { return s.name === moduleName; })
                .filter(function (s) { return summary_1.summaries.some(function (ss) { return ss.metadata.__symbol === s.__symbol; }); });
            var m = symbols[0];
            var filePath = m.filePath.replace(/^(.*)\.d\.ts$/, '$1');
            return this.trackSymbolRootDecl(this.sourceTreeToGenDir(filePath), moduleName);
        }
        else if (fs.existsSync(absPath + this.query.moduleSuffix + '.ts')) {
            return absPath;
        }
        else {
            return this.trackSymbolRootDecl(absPath + summarySuffix, moduleName);
        }
    };
    /**
     * Convert a source tree file path into a it's genDir representation
     * this only change the path to the file, not the file iteself (i.e: suffix)
     * @param absFilePath
     * @returns {string}
     */
    Loader.prototype.sourceTreeToGenDir = function (absFilePath) {
        if (this.query.genDir && this.query.genDir !== '.') {
            var relativeNgModulePath = path.relative(this.query.tsconfigDir, absFilePath);
            return path.join(path.resolve(this.query.tsconfigDir, this.query.genDir), relativeNgModulePath);
        }
        else {
            return absFilePath;
        }
    };
    Loader.prototype.genDirToSourceTree = function (absFilePath) {
        if (this.query.genDir && this.query.genDir !== '.') {
            var relativeNgModulePath = path.relative(path.resolve(this.query.tsconfigDir, this.query.genDir), absFilePath);
            return path.join(this.query.tsconfigDir, relativeNgModulePath);
        }
        else {
            return absFilePath;
        }
    };
    Loader.setCodeGen = function (name, codeGen) {
        Loader.LOADER_CODEGEN_MAP.set(name, codeGen);
    };
    Loader.LOADER_CODEGEN_MAP = new Map();
    return Loader;
}());
exports.Loader = Loader;
//# sourceMappingURL=Loader.js.map