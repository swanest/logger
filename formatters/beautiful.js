var _ = require("lodash"),
    moment = require("moment"),
    util = require("util"),
    CustomError = require("../custom-error");


module.exports = function createFormatter(opts) {

    if (opts == void 0)
        opts = {};

    _.defaults(opts, {
        //namespaceColor:"black"
        environment: true, //can be a boolean, string or a cb(environment)
        linesBetweenLogs: 2,
        namespace: true, //can be a boolean, string or a cb(namespace)
        contentsContext: false,
        idContext: true,
        level: true, //can be a cb(level)
        pid: true,
        date: "DD/MM/YY HH:mm UTC", //can be a boolean, string or a cb(date)
        inBetweenDuration: true,
        displayLineNumber: true,
        arraySampling: 30
    });


    function samplingArray(arr) {
        if (arr.length <= opts.arraySampling)
            return arr;
        let jump = Math.ceil(arr.length / 3 + 1),
            nArray = {};
        for (let i = 0; i < opts.arraySampling; i++) {
            let n = i * jump;
            if (n > (arr.length - 1)) {
                nArray[arr.length - 1] = arr[arr.length - 1];
                break;
            }
            nArray[n] = arr[n];
        }
        return nArray;
    };

    if (opts.context) { //alias for opts.contentsContext
        opts.contentsContext = opts.context;
        delete opts.context;
    }

    var colors = { // see http://misc.flogisoft.com/bash/tip_colors_and_formatting
            'bold': [1],
            'italic': [3],
            'underline': [4],
            'inverse': [7, 1, 31, 47],
            'white': [1, 37],
            'black': [1, 30],
            'blue': [94],
            'darkBlue': [34],
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
            FATAL: 'inverse',
            PROGRESS: "green"
        };

    //Empty-line creator
    function N(n) {
        var str = "";
        for (var i = 0; i < n; i++)
            str += "\n";
        return str;
    };

    //Colorize text
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
        else if (_.isRegExp(inp))
            return "regExp";
        else if (inp instanceof Error)
            return "error";
        else if (inp && _.isFunction(inp.getTimestamp) && _.isFunction(inp.toString) && inp.toString().length == 24)
            return "ObjectId";
        else if (_.isPlainObject(inp))
            return "plainObject";
        else {
            return typeof inp;
        }
    };

    //Generate a spaces-string
    function genSpace(initSpace, spaceString, nSpaces) {
        let sp = initSpace;
        for (var i = 0; i < nSpaces; i++)
            sp += spaceString;
        return sp;
    };

    function objectFormatter(config) {

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
            object: "bold",
            plainObject: "bold",
            regExp: "yellow"
        };

        let obj = config.obj,
            initSpace = config.initSpace || "",
            spaceString = config.spaceString || " ",
            nSpaces = config.nSpaces || 1, //indentation space
            noColor = config.noColor,
            prevKey = config.prevKey || '',
            path = config.path || '·',
            seenObjects = this.seenObjects || [],
            found,
            type = customTypeOf(obj),
            out = "";

        if (!this.recursive) //First call
            out += N(1) + initSpace;

        //Prevent circularity
        if (_.isObject(obj) && !_.isFunction(obj)) {
            found = _.find(seenObjects, function (it) {
                return it.object == obj;
            });
            if (found !== void 0) {
                return "(ref. to '" + found.path + "' " + (_.get(obj, "constructor.name") || "") + ")";
            }
            seenObjects.push({object: obj, key: prevKey, path: path})
        }

        //Get ready for sub-levels
        nSpaces++;

        let formatted = obj;

        //Native display transformation if available
        if (obj instanceof Map || obj instanceof Set) { //If Map or Set, translate it to a plainObject
            formatted = {};
            for (let [key, value] of obj.entries()) {
                formatted[key] = value;
            }
        }
        else if (type == "array")
            formatted = samplingArray(obj);
        else if (type == "error") {
            if (!obj.isCustomError)
                obj = new CustomError().use(obj);
            formatted = obj.toJSON().error;
            if (_.isString(formatted.stack)) {
                let cSpace = genSpace(initSpace, spaceString, nSpaces),
                    stack = "\n" + _.map(formatted.stack.split("\n"), (line) => {
                            line = line.trim();
                            line = cSpace + spaceString + line;
                            return line;
                        }).join("\n");
                formatted.stack = stack;
            }
        }
        else if (obj && _.isFunction(obj.toISOString))
            formatted = obj.toISOString();
        else if (obj && _.isFunction(obj.toJSON))
            formatted = obj.toJSON();

        let keysSet = _.keys(formatted),
            keysSetLength = keysSet.length,
            kString,
            currentSpace = genSpace(initSpace, spaceString, nSpaces) + "|", //sub-level
            pref = "";

        if (type == 'array')
            keysSetLength = obj.length + (obj.length != keysSetLength ? ' (sampled)' : '' );

        if (!keysSetLength)
            pref = "empty ";
        else
            pref = "size=" + keysSetLength + ",";

        if (type == "function") {
            out += stylize('[Function: ' + (obj.name === '' ? 'anonymous' : obj.name) + ']', noColor || colorsByType[type] || true);
            return out;
        }
        else if (type != "error" && type != "object" && type != "array" && type != "plainObject") {
            out += stylize(formatted + " [" + type + "]", noColor || colorsByType[type] || true);
            return out;
        }

        out += stylize((_.get(obj, "constructor.name") || "") + "[" + pref + type + "]", noColor || colorsByType[type] || true);

        keysSet.forEach(function (k) {
            out += N(1);
            type = customTypeOf(obj[k]);
            kString = stylize(k, noColor || colorsByType[type] || true);
            out += currentSpace + kString + " : ";
            out += objectFormatter.call({recursive: true, seenObjects: _.clone(seenObjects)}, {
                obj: formatted[k],
                initSpace: initSpace,
                spaceString: spaceString,
                nSpaces: nSpaces,
                noColor: noColor,
                prevKey: k,
                path: path + '.' + k
            });

        });


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


    let progression = null;
    return function beautifulFormatter(args, level, extra) {
        args = _.clone(args);
        var line = "", formattedContext, optFormattedVal;

        if (opts.environment) {
            if (_.isString(opts.environment))
                optFormattedVal = opts.environment;
            else if (_.isFunction(opts.environment))
                optFormattedVal = opts.environment(this.config.environment)
            else
                optFormattedVal = "[" + this.config.environment + "]";
            line += stylize(optFormattedVal, "bold");
        }


        if (opts.namespace && _.isString(this.config.namespace)) {
            if (_.isString(opts.namespace))
                optFormattedVal = opts.namespace;
            else if (_.isFunction(opts.namespace))
                optFormattedVal = opts.namespace(this.config.namespace)
            else
                optFormattedVal = "#" + this.config.namespace;
            line += stylize(optFormattedVal, opts.namespaceColor || alphabetColors[this.config.namespace[0]]) + "  ";
        }

        if (opts.idContext && _.get(this.config, "context.id"))
            line += stylize(_.get(this.config, "context.id"), "underline") + "  ";

        if (opts.level)
            line += stylize(_.isFunction(opts.level) ? opts.level(level) : level, colorFromLevel[level]) + "  ";

        if (opts.pid)
            line += stylize(process.pid, colorFromLevel[level]) + "  ";

        if (opts.displayLineNumber) {

            let stack, lineStack;
            if (extra && extra.stack)
                stack = extra.stack, lineStack = 3;
            else
                stack = new Error().stack, lineStack = 4;

            let logLineDetails = stack.split("at ")[lineStack].trim().replace(')', '');
            let b = logLineDetails.split('\\').pop().split('/');
            if (_.isString(_.get(opts.displayLineNumber, 'rootDirName'))) {
                let i = b.length - 1;
                while (b[i] != opts.displayLineNumber.rootDirName && i > 0) {
                    i--;
                }
                b = b.slice(-(b.length - 1 - i)).join('/');
            }
            else
                b = b.slice(-2).join('/');

            line += stylize(b, colorFromLevel[level]) + "  ";
        }

        if (opts.date) {
            if (_.isString(opts.date))
                optFormattedVal = moment.utc().format(opts.date);
            else if (_.isFunction(opts.date))
                optFormattedVal = opts.date();
            else
                optFormattedVal = moment.utc().toISOString();
            line += stylize(optFormattedVal, colorFromLevel[level]) + "  ";
        }

        if (opts.inBetweenDuration)
            line += stylize("+" + moment.utc().diff(this.config.lastLogged, "ms") + "ms", colorFromLevel[level]) + "  ";

        if (opts.contentsContext && _.get(this.config, "context.contents")) {
            line += "\n";
            line += stylize("context:", "black");
            formattedContext = _.isFunction(opts.contentsContext) ? opts.contentsContext(this.config.context.contents) : this.config.context.contents;
            if (_.isPlainObject(formattedContext)) {
                formattedContext = objectFormatter({
                    obj: formattedContext,
                    spaceString: " ",
                    nSpaces: 2,
                    noColor: true
                });
            }
            else
                line += " ";
            line += stylize(formattedContext, "black") + N(1);
        }


        if (level == "PROGRESS") {
            let clear = true;
            if (!progression) {
                progression = {p: 0, t: moment.utc().unix()};
            }
            if (_.isFinite(args[0]) && args[0] == 0) {
                line += stylize(`...%`, colorFromLevel[level]);
            }
            else if (_.isFinite(args[0]) && args[0] > 0) {
                progression.p = args[0];
                let timeSpent = moment.utc().unix() - progression.t,
                    timeExpected = Math.round(1 / (progression.p / timeSpent));
                line += stylize(`${(args[0] * 100).toFixed(2)}% - ${timeSpent}s/${timeExpected}s`, colorFromLevel[level]);
            }
            else //done
                line = N(opts.linesBetweenLogs), clear = false, progression = null;
            return {
                streamName: "stdout",
                output: line,
                clear: clear
            };
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
        if (args.length == 2 && _.isObject(args[0]) && !(args[0] instanceof Error) && _.isObject(args[1]) && !(args[1] instanceof Error)) {
            var a = objectFormatter({obj: args[0], spaceString: " ", nSpaces: 3, noColor: true}).split("\n"),
                b = objectFormatter({obj: args[1], spaceString: " ", nSpaces: 3, noColor: true}).split("\n");
            var maxL = _.max([a.length, b.length]),
                aLongest = _.maxBy(a, "length").length;
            var completeLine = "\n";
            for (var i = 1; i < maxL; i++) {
                var al = (_.get(a, i) || "" ), bl = (_.get(b, i) || "" ), separ = "|";
                if (al == bl) separ = "=";
                while (al.length < aLongest)
                    al += " ";
                al += "  " + separ + "     " + bl + N(1);
                completeLine += al;

            }

            return {
                streamName: (level == "DEBUG" || level == "INFO") ? "stdout" : "stderr",
                output: line + completeLine + N(opts.linesBetweenLogs - 1)
            };

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
            if (_.keys(extra).length)
                line += objectFormatter({
                    obj: extra,
                    initSpace: "    ",
                    spaceString: " ",
                    nSpaces: 2
                });
            line += N(1);

            return {
                streamName: (level == "DEBUG" || level == "INFO") ? "stdout" : "stderr",
                output: line + N(opts.linesBetweenLogs - 1)
            };

        }

        //Otherwise we just display
        for (var i = 0; i < args.length; i++) {
            if (_.isBoolean(args[i]) || _.isString(args[i]) || _.isFinite(args[i]))
                line += (args[i].toString());
            else if (_.isFunction(args[i]))
                line += '[Function: ' + (args[i].name === '' ? 'anonymous' : args[i].name) + ']';
            else if (_.isRegExp(args[i]))
                line += args[i].toString();
            else if (_.isNull(args[i]))
                line += "null";
            else if (_.isUndefined(args[i]))
                line += "undefined";
            else if (_.isObject(args[i]))
                line += objectFormatter({obj: args[i], spaceString: " ", nSpaces: 2});
            line += " ";
        }

        line += N(opts.linesBetweenLogs);

        return {
            streamName: (level == "DEBUG" || level == "INFO") ? "stdout" : "stderr",
            output: line
        };


    };

};