var _ = require("lodash"),
    moment = require("moment"),
    util = require("util");


module.exports = function beautiful(opts) {

    if (opts == void 0)
        opts = {};

    _.defaults(opts, {
        //namespaceColor:"black"
        environment: true,
        linesBetweenLogs: 2,
        namespace: true,
        context: false,
        idContext: true,
        level: true,
        pid: true,
        date: "DD/MM/YY HH:mm UTC",
        inBetweenDuration: true
    });

    var colors = {
            'bold': [1],
            'italic': [3],
            'underline': [4],
            'inverse': [7, 1, 31, 47],
            'white': [1, 37],
            'black': [1, 30],
            'blue': [34],
            'cyan': [36],
            'green': [1, 32],
            'magenta': [35],
            'red': [1, 31],
            'yellow': [33]
        },
        colorFromLevel = {
            DEBUG: 'green',
            INFO: 'cyan',
            WARNING: 'yellow',
            ERROR: 'red',
            FATAL: 'inverse'
        };


    function N(n) {
        var str = "";
        for (var i = 0; i < n; i++)
            str += "\n";
        return str;
    };


    var stylize = _.rest(function (str, cols) {
        if (!str)
            return '';
        var col, codes;
        for (var i = 0; i < cols.length; i++) {
            col = cols[i];
            if (col == true) //noColor
                return str;
            var codes = colors[col];
            if (codes)
                str = '\033[' + codes.join(';') + 'm' + str + '\033[0m';
            else
                return str;
        }
        return str;
    });

    var customTypeOf = function (inp) {
        if (_.isString(inp) && moment.utc(inp, "YYYY-MM-DDTHH:mm:ss.SSSZ", true).isValid())
            return "ISOStringDate";
        else if (_.isDate(inp))
            return "JSDate";
        else if (inp instanceof moment().__proto__.constructor)
            return "momentJSDate";
        else if (_.isArray(inp))
            return "array";
        else if (_.isUndefined(inp))
            return "undefined";
        else if (_.isNull(inp))
            return "null";
        else {
            return typeof inp;
        }
    };

    function objectFormatter(obj, spaceString, nSpaces, noColor) {
        var seenObjects = this.seenObjects || [];


        if (!nSpaces)
            nSpaces = 0;
        if (!spaceString)
            spaceString = " ";
        var currentSpaces = "";
        for (var i = 0; i < nSpaces; i++)
            currentSpaces += spaceString;
        var type = " [" + customTypeOf(obj) + "]";
        var out = "";
        if (obj != void 0 && obj.toISOString != void 0) {
            out += stylize(obj.toISOString() + type, noColor || 'cyan');
            return out;
        } else if (_.isFunction(obj)) {
            out += stylize('[Function: ' + (obj.name === '' ? 'anonymous' : obj.name) + ']', noColor || 'cyan');
            return out;
        } else if (_.isString(obj)) {
            out += stylize(obj + type, noColor || "yellow");
            return out;
        } else if (_.isFinite(obj)) {
            out += stylize(obj + type, noColor || "blue");
            return out;
        } else if (_.isNull(obj)) {
            out += stylize(obj + type, noColor || "red");
            return out;
        } else if (_.isBoolean(obj)) {
            out += stylize(obj + type, noColor || "magenta");
            return out;
        } else if (_.isUndefined(obj)) {
            out += stylize(obj + type, noColor || "red");
            return out;
        } else if (!_.isObject(obj)) {
            out += obj + type;
            return out;
        }
        if (_.isObject(obj)) {
            if (seenObjects.indexOf(obj) !== -1) {
                return "(Circular)";
            }
            seenObjects.push(obj);
        }
        nSpaces++;
        if (nSpaces > 1)
            out += type;
        var kString;
        if (obj && _.isFunction(obj.toJSON)) {
            obj = obj.toJSON();
        }
        for (var k in obj) {
            if (!obj.hasOwnProperty(k)) {
                continue;
            }
            out += "\n";
            type = customTypeOf(obj[k]);
            kString = k;
            if (type == "number")
                kString = stylize(k, noColor || "blue");
            else if (type == "array")
                kString = stylize(k, noColor || "underline");
            else if (type == "object")
                kString = stylize(k, noColor || "bold");
            else if (type == "string")
                kString = stylize(k, noColor || "yellow");
            else if (type == "ISOStringDate" || type == "momentJSDate" || type == "JSDate")
                kString = stylize(k, noColor || "cyan");
            else if (type == "undefined" || type == "null")
                kString = stylize(k, noColor || "red");
            out += currentSpaces + kString + " : " + objectFormatter.call({seenObjects: seenObjects}, obj[k], spaceString, nSpaces, noColor);
        }
        return out;
    };

    var alphabetColors = {
        "a": "black",
        "b": "blue",
        "c": "cyan",
        "d": "green",
        "e": "magenta",
        "f": "blue",
        "g": "yellow",
        "h": "black",
        "i": "blue",
        "j": "cyan",
        "k": "green",
        "l": "magenta",
        "m": "cyan",
        "n": "yellow",
        "o": "black",
        "p": "blue",
        "q": "cyan",
        "r": "green",
        "s": "magenta",
        "t": "magenta",
        "u": "yellow",
        "v": "black",
        "w": "blue",
        "x": "cyan",
        "y": "green",
        "z": "magenta"
    };

    return function (args, level) {
        args = _.clone(args);


        //    namespace: true,
        //    context: true,
        //    idContext : true,
        //    level: true,
        //    pid: true,
        //    date: true,
        //    inBetweenDuration: true

        var line = "", formattedContext;
        if (opts.environment)
            line += stylize("[" + this.config.environment + "]", "bold");
        if (opts.namespace && _.isString(this.config.namespace))
            line += stylize("#" + this.config.namespace, "bold", opts.namespaceColor || alphabetColors[this.config.namespace[0]]) + "  ";
        if (opts.idContext && _.get(this.config, "context.id"))
            line += stylize(_.get(this.config, "context.id"), "underline") + "  ";
        if (opts.level)
            line += stylize(level, colorFromLevel[level]) + "  ";
        if (opts.pid)
            line += stylize(process.pid, colorFromLevel[level]) + "  ";
        if (opts.date)
            line += stylize(moment.utc().format(opts.date), colorFromLevel[level]) + "  ";
        if (opts.inBetweenDuration)
            line += stylize("+" + moment.utc().diff(this.config.lastLogged, "ms") + "ms", colorFromLevel[level]) + "  ";
        if (opts.context && _.get(this.config, "context.contents")) {
            line += "\n";
            line += stylize("context:", "black");
            formattedContext = _.isFunction(opts.context) ? opts.context(this.config.context.contents) : this.config.context.contents;
            if (_.isPlainObject(formattedContext)) {
                line += N(1);
                formattedContext = objectFormatter(formattedContext, " ", 2, true);
            }
            else
                line += " ";
            line += formattedContext + N(1);
        }


        //Format args
        var index = 0, argsIndexesToRemove = [];
        if (_.isString(args[0])) {
            args[0] = args[0].replace(/%([a-z%])/g, function (match, format) {
                // if we encounter an escaped % then don't increase the array index
                if (format === '%') return match;
                index++;
                argsIndexesToRemove.push(index);
                var replacingValue = args[index];
                if (_.isPlainObject(replacingValue))
                    replacingValue = util.inspect(replacingValue, {showHidden: true, depth: null});
                if (_.isFunction(replacingValue))
                    replacingValue = '[Function: ' + (replacingValue.name === '' ? 'anonymous' : replacingValue.name) + ']';
                return replacingValue;
            });
            argsIndexesToRemove.forEach(function (ind) {
                delete args[ind];
            });
        }
        args = _.map(args);

        //Now, discover each distinct argument

        //If 2 args and 2 objects, let's compare
        if (args.length == 2 && (_.isPlainObject(args[0]) || _.isArray(args[0])) && (_.isPlainObject(args[1]) || _.isArray(args[1]))) {
            var a = objectFormatter(args[0], " ", 3, true).split("\n"),
                b = objectFormatter(args[1], " ", 3, true).split("\n");
            var maxL = _.max([a.length, b.length]),
                aLongest = _.maxBy(a, "length").length;
            var completeLine = "\n";
            for (var i = 0; i < maxL; i++) {
                var l = (_.get(a, i) || "" );
                while (l.length < aLongest)
                    l += " ";
                l += "  |     " + (_.get(b, i) || "" ) + N(1);
                completeLine += l;

            }
            return line + completeLine + N(opts.linesBetweenLogs - 1);
        }

        var error, extra = {}, message = "", codeString, code, unclassified = [];

        for (var k in args) {
            if (args[k] instanceof Error)
                error = args[k];
        }

        //If error, we unified the log
        if (error) {
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
                    code = args[i].code, codeString = args[i].codeString;
                    _.extend(extra, args[i].extra);
                    _.extend(extra, args[i].info);
                }
                else {
                    unclassified.push(args[i]);
                }
            }

            if (unclassified.length)
                extra.unclassified = unclassified;


            if (message)
                line += stylize(message, "red") + N(1);

            if (codeString)
                line += stylize("(" + (code ? code + ":" : "") + codeString + ")", "red");
            line += stylize(error.stack, "red");
            line += objectFormatter({extra: extra}, " ", 2);
            line += N(1);
            return line + N(opts.linesBetweenLogs - 1);
        }

        //Otherwise we just display
        for (var i = 0; i < args.length; i++) {
            if (_.isString(args[i]) || _.isFinite(args[i]) || _.isUndefined(args[i])) {
                line += (args[i] || "undefined") + " ";
            }
            else if (_.isFunction(args[i])) {
                line += '[Function: ' + (args[i].name === '' ? 'anonymous' : args[i].name) + ']';
            }
            else if (_.isObject(args[i])) {
                line += N(1);
                line += objectFormatter(args[i], " ", 2) + " ";
            }

        }

        line += N(opts.linesBetweenLogs);
        return line;

    };

};