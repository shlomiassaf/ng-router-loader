"use strict";
var loaderUtils = require('loader-utils');
var path = require('path');
var options_1 = require('./options');
var RouteDestination = (function () {
    function RouteDestination(loadChildrenPath, sourceResourcePath, query) {
        this.loadChildrenPath = loadChildrenPath;
        this.sourceResourcePath = sourceResourcePath;
        this.query = query;
        var _a = loadChildrenPath.split('?'), pathString = _a[0], pathQuery = _a[1];
        var _b = Object.assign({}, options_1.DEFAULT_RESOURCE_OPTIONS, loaderUtils.parseQuery(pathQuery ? '?' + pathQuery : '')), loader = _b.loader, chunkName = _b.chunkName, bySymbol = _b.bySymbol;
        this.options = {
            loader: typeof loader === 'string' ? loader : query.loader,
            chunkName: chunkName,
            bySymbol: typeof bySymbol === 'boolean' ? bySymbol : query.bySymbol
        };
        // split the string on the delimiter
        var _c = pathString.split(query.delimiter), filePath = _c[0], moduleName = _c[1];
        this.rawFilePath = filePath;
        this.moduleName = moduleName || 'default';
        this.isCompiled = this.getFilename(sourceResourcePath).endsWith(query.moduleSuffix);
        this.isRawRelative = filePath.startsWith('.');
        var currentDir = path.dirname(sourceResourcePath);
        // the absolute path of our destenation NgModule module.
        this.filePath = path.resolve(currentDir, filePath);
    }
    RouteDestination.prototype.getFilename = function (resourcePath) {
        var filename = path.basename(resourcePath);
        return path.basename(resourcePath, path.extname(filename));
    };
    return RouteDestination;
}());
exports.RouteDestination = RouteDestination;
//# sourceMappingURL=RouteModule.js.map