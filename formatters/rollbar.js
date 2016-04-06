var _ = require("lodash");

module.exports = function (opts) {

    return function (args, level) {

        args = _.clone(args);
        var index = 0, argsIndexesToRemove = [];
        if (_.isString(args[0])) {
            args[0] = args[0].replace(/%([a-z%])/g, function (match, format) {
                // if we encounter an escaped % then don't increase the array index
                if (format === '%') return match;
                index++;
                argsIndexesToRemove.push(index);
                var replacingValue = args[index];
                if (!replacingValue)
                    return match;
                if (_.isPlainObject(replacingValue))
                    replacingValue = JSON.stringify(replacingValue);
                return replacingValue;
            });
            argsIndexesToRemove.forEach(function (ind) {
                delete args[ind];
            });
        }
        args = _.map(args);


        var error, extra = {}, message = "", codeString, code, unclassified = [];

        for (var i = 0; i < args.length; i++) {
            if (_.isPlainObject(args[i]))
                _.extend(extra, args[i]);
            else if (_.isString(args[i]) && args[i].length < 140) {
                if (!message)
                    message = args[i];
                else
                    message += " " + args[i];
            }
            else if (args[i] instanceof Error) {
                error = args[i], code = args[i].code, codeString = args[i].codeString;
                _.extend(extra, args[i].extra);
                _.extend(extra, args[i].info);
            }
            else {
                unclassified.push(args[i]);
            }
        }
        if (message)
            extra.message = message;
        if (codeString)
            extra.codeString = codeString;
        if (code)
            extra.code = code;
        if (unclassified.length)
            extra.unclassified = unclassified;

        if (opts.context && _.get(this.config, "context.contents")) {
            extra.context = _.isFunction(opts.context) ? opts.context(this.config.context.contents) : this.config.context.contents;
            if (this.config.context.id)
                extra.idContext = this.config.context.id;
        }

        var rollbarTranslations = {
            FATAL: "critical",
            ERROR: "error",
            WARNING: "warning",
            INFO: "info",
            DEBUG: "debug"
        };

        return {
            error: error,
            level: rollbarTranslations[level],
            custom: extra,
            message: message
        };


    };
};