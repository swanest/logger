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

    //Get the specific type
    var customTypeOf = function (inp) {
        if (_.isString(inp) && moment.utc(inp, "YYYY-MM-DDTHH:mm:ss.SSSZ", true).isValid())
            return "ISOStringDate";
        else if (_.isDate(inp))
            return "JSDate";
        else if (inp instanceof moment().__proto__.constructor)
            return "momentJSDate";
        else if (_.isArray(inp))
            return "array";
        else if (_.isFinite(inp))
            return "number";
        else if (_.isNaN(inp))
            return "NaN";
        else if (_.isFunction(inp))
            return "function";
        else if (_.isUndefined(inp))
            return "undefined";
        else if (_.isNull(inp))
            return "null";
        else if (_.isBoolean(inp))
            return "boolean";
        else if (inp instanceof Error)
            return "error";
        else if (inp && _.isFunction(inp.getTimestamp) && _.isFunction(inp.toString) && inp.toString().length == 24)
            return "ObjectId";
        else {
            return typeof inp;
        }
    };

    function objectFormatter(obj, spaceString, nSpaces, noColor, prevKey) {
        if (!nSpaces)
            nSpaces = 0;
        if (!spaceString)
            spaceString = " ";

        var seenObjects = this.seenObjects || [],
            found,
            currentSpaces = "",
            type = customTypeOf(obj),
            out = "";
        for (var i = 0; i < nSpaces; i++)
            currentSpaces += spaceString;
        currentSpaces += "|";

        //Prevent circularity
        if (_.isObject(obj) && !_.isFunction(obj)) {
            found = _.find(seenObjects, function (it) {
                return it.object == obj;
            });
            if (found !== void 0) {
                return "(Circular 'key:" + found.key + "' " + (_.get(obj, "constructor.name") || "") + ")";
            }
            seenObjects.push({object: obj, key: prevKey})
        }

        //Native display transformation if available
        if (obj && _.isFunction(obj.toISOString))
            obj = obj.toISOString();
        else if (obj && _.isFunction(obj.toJSON))
            obj = obj.toJSON();

        var colorsByType = {
            string: "yellow",
            number: "blue",
            null: "red",
            error: "red",
            NaN: "red",
            undefined: "red",
            boolean: "magenta",
            ISOStringDate: "cyan",
            JSDate: "cyan",
            momentJSDate: "cyan",
            function: "cyan",
            array: "underline",
            object: "bold"
        };


        if (type == "function") {
            out += stylize('[Function: ' + (obj.name === '' ? 'anonymous' : obj.name) + ']', noColor || colorsByType[type] || true);
            return out;
        }
        else if (type != "error" && type != "object" && type != "array") {
            out += stylize(obj + " [" + type + "]", noColor || colorsByType[type] || true);
            return out;
        }
        nSpaces++;

        var keysSet = type == "error" ? Object.getOwnPropertyNames(obj) : _.keys(obj);
        var pref = "";
        if (nSpaces > 1) {
            if (!keysSet.length)
                pref = "empty ";
            else
                pref = "size=" + keysSet.length + ",";
            out += stylize((_.get(obj, "constructor.name") || "") + "[" + pref + type + "]", noColor || colorsByType[type] || true);
        }


        var kString;
        keysSet.forEach(function (k) {
            out += "\n";
            type = customTypeOf(obj[k]);
            kString = stylize(k, noColor || colorsByType[type] || true);
            out += currentSpaces + kString + " : " + objectFormatter.call({seenObjects: _.clone(seenObjects)}, obj[k], spaceString, nSpaces, noColor, k);
        })
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
        //(_.isPlainObject(args[0]) || _.isArray(args[0])) && (_.isPlainObject(args[1]) || _.isArray(args[1]))

        if (args.length == 2 && _.isObject(args[0]) && !(args[0] instanceof Error) && _.isObject(args[1]) && !(args[1] instanceof Error)) {
            var a = objectFormatter(args[0], " ", 3, true).split("\n"),
                b = objectFormatter(args[1], " ", 3, true).split("\n");
            var maxL = _.max([a.length, b.length]),
                aLongest = _.maxBy(a, "length").length;
            var completeLine = "\n";
            for (var i = 0; i < maxL; i++) {
                var al = (_.get(a, i) || "" ), bl = (_.get(b, i) || "" ), separ = "|";
                if (al == bl) separ = "=";
                while (al.length < aLongest)
                    al += " ";
                al += "  " + separ + "     " + bl + N(1);
                completeLine += al;

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
            if (_.isBoolean(args[i]) || _.isString(args[i]) || _.isFinite(args[i])) {
                line += (args[i].toString()) + " ";
            }
            else if (_.isFunction(args[i])) {
                line += '[Function: ' + (args[i].name === '' ? 'anonymous' : args[i].name) + ']';
            }
            else if (_.isObject(args[i])) {
                line += N(1);
                line += objectFormatter(args[i], " ", 2) + " ";
            }
            else if (_.isUndefined(args[i])) {
                line += "undefined ";
            }

        }

        line += N(opts.linesBetweenLogs);
        return line;

    };

};