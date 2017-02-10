"use strict";
var Loader = require('./src/Loader');
var builtin_codegens_1 = require('./src/builtin_codegens');
function loader(source, sourcemap) {
    var _this = this;
    this.cacheable && this.cacheable();
    this.async();
    var l = new Loader.Loader(this);
    l.replace(source)
        .then(function (results) {
        if (results) {
            results.forEach(function (result) {
                source = result.source;
                if (result.debug) {
                    var d = [
                        '================================== ng-router-loader ==================================',
                        ("Importer:    " + _this.resourcePath),
                        ("Raw Request: " + result.match),
                        ("Replacement: " + result.replacement),
                        '======================================================================================'
                    ];
                    console.log(d.join('\n'));
                }
            });
        }
        _this.callback(null, source, sourcemap);
    })
        .catch(function (err) { return _this.callback(err); });
}
var loader;
(function (loader) {
    /**
     * Add a code generator that can be used in the 'loader' option.
     * @param name
     * @param codeGen
     */
    function setCodeGen(name, codeGen) {
        Loader.Loader.setCodeGen(name, codeGen);
    }
    loader.setCodeGen = setCodeGen;
})(loader || (loader = {}));
builtin_codegens_1.BUILT_IN_CODEGENS.forEach(function (cgDef) { return Loader.Loader.setCodeGen(cgDef.name, cgDef.codeGen); });
module.exports = loader;
//# sourceMappingURL=index.js.map