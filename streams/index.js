var _ = require("lodash"),
    modules = {};
require("fs").readdirSync(__dirname).forEach(function (file) {
    var label = file.substr(-2) == "js" ? file.substr(0, file.length - 3) : file;
    if (label != "index" && label.indexOf(".") != 0)
        modules[_.camelCase(label)] = require(__dirname + "/" + file);
});
module.exports = modules;