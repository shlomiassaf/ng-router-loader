"use strict";
function getRequireString(file, module) {
    return 'require(\'' + file + '\')[\'' + module + '\']';
}
exports.syncCodeGen = function (file, module) { return ("loadChildren: function() { return " + getRequireString(file, module) + "; }"); };
exports.ensureCodeGen = function (file, module, loaderOptions, resourceOptions) {
    var requireString = getRequireString(file, module);
    var webpackChunkName = resourceOptions.chunkName ? ", '" + resourceOptions.chunkName + "'" : '';
    var result = [
        "loadChildren: function() { return new Promise(function (resolve) {",
        "  require.ensure([], function (require) {",
        ("    resolve(" + requireString + ");"),
        ("  }" + webpackChunkName + ");"),
        "})}"
    ];
    return loaderOptions.inline ? result.join('') : result.join('\n');
};
exports.systemCodeGen = function (file, module, opts) {
    exports.systemCodeGen['deprecated']();
    var result = [
        ("loadChildren: function() { return System.import('" + file + "')"),
        (".then( function(module) { return module['" + module + "']; } ); }")
    ];
    return opts.inline ? result.join('') : result.join('\n');
};
exports.systemCodeGen['deprecated'] = function () {
    console.warn('\nDEPRECATED: ng-router-loader "async-system" loader use the System.import construct which is deprecated in webpack 2 and will be removed in webpack 3, please use the "async-import" instead. (https://github.com/webpack/webpack/releases/tag/v2.1.0-beta.28)\n');
    exports.systemCodeGen['deprecated'] = function () { };
};
exports.importCodeGen = function (file, module, opts) {
    var result = [
        ("loadChildren: function() { return import('" + file + "')"),
        ("  .then( function(module) { return module['" + module + "']; } ); }")
    ];
    return opts.inline ? result.join('') : result.join('\n');
};
exports.BUILT_IN_CODEGENS = [
    { name: 'sync', codeGen: exports.syncCodeGen },
    { name: 'async-require', codeGen: exports.ensureCodeGen },
    { name: 'async-import', codeGen: exports.importCodeGen },
    { name: 'async-system', codeGen: exports.systemCodeGen }
];
//# sourceMappingURL=builtin_codegens.js.map