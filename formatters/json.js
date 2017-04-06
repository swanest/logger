var _ = require("lodash"),
    moment = require("moment"),
    util = require("util"),
    CustomError = require("../custom-error");


module.exports = function createFormatter(opts) {

    if (opts == void 0)
        opts = {};

    _.defaults(opts, {
        internalPrefix: '__#',
        environment: true, //can be a a boolean, string or a cb(environment)
        namespace: true, //can be a boolean, string or a cb(namespace)
        contentsContext: true,
        idContext: true,
        level: true, //can be a boolean or cb(level)
        pid: true,
        inBetweenDuration: true,
        displayLineNumber: true,
        extraFormatter: false // can be a function that re-transforms the output
    });

    if (opts.context) { //alias for opts.contentsContext
        opts.contentsContext = opts.context;
        delete opts.context;
    }

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

    function objectFormatter(config) {
        let obj = config.obj,
            prevKey = config.prevKey || '',
            path = config.path || '·',
            seenObjects = this.seenObjects || [],
            found,
            type = customTypeOf(obj),
            out = {};
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
        let formatted = obj;
        //Native display transformation if available
        if (obj instanceof Map || obj instanceof Set) { //If Map or Set, translate it to a plainObject
            formatted = {};
            for (let [key, value] of obj.entries()) {
                formatted[key] = value;
            }
        }
        else if (type == "error") {
            if (!obj.isCustomError)
                obj = new CustomError().use(obj);
            formatted = obj.toJSON().error;
        }
        else if (obj && _.isFunction(obj.toISOString))
            formatted = obj.toISOString();
        else if (obj && _.isFunction(obj.toJSON))
            formatted = obj.toJSON();
        let keysSet = _.keys(formatted),
            kString,
            pref = "";
        if (!keysSet.length)
            pref = "empty ";
        else
            pref = "size=" + keysSet.length + ",";
        if (type == "function") {
            return '[Function: ' + (obj.name === '' ? 'anonymous' : obj.name) + ']';
        }
        else if (type != "error" && type != "object" && type != "array" && type != "plainObject") {
            return formatted + " [" + type + "]";
        }
        out[opts.internalPrefix + 'type'] = (_.get(obj, "constructor.name") || "") + "[" + pref + type + "]";
        keysSet.forEach(function (k) {
            type = customTypeOf(obj[k]);
            kString = k;
            out[k] = objectFormatter.call({recursive: true, seenObjects: _.clone(seenObjects)}, {
                obj: formatted[k],
                prevKey: k,
                path: path + '.' + k
            });
        });
        return out;
    };


    return function jsonFormatter(args, level, extra) {
        args = _.clone(args);
        var line = {}, formattedContext, optFormattedVal;
        if (opts.environment) {
            if (_.isString(opts.environment))
                optFormattedVal = opts.environment;
            else if (_.isFunction(opts.environment))
                optFormattedVal = opts.environment(this.config.environment)
            else
                optFormattedVal = this.config.environment;
            line['environment'] = optFormattedVal;
        }

        if (opts.namespace && _.isString(this.config.namespace)) {
            if (_.isString(opts.namespace))
                optFormattedVal = opts.namespace;
            else if (_.isFunction(opts.namespace))
                optFormattedVal = opts.namespace(this.config.namespace)
            else
                optFormattedVal = this.config.namespace;
            line['namespace'] = optFormattedVal;
        }

        if (opts.idContext && _.get(this.config, "context.id"))
            line['idContext'] = _.get(this.config, "context.id");

        if (opts.level)
            line['level'] = _.isFunction(opts.level) ? opts.level(level) : (level == 'KPI' ? 'INFO' : level);

        if (opts.pid)
            line['pid'] = process.pid;

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
            line['logLocation'] = b;
        }

        if (opts.inBetweenDuration && (!args || args[0] !== '_KPI_'))
            line['inBetweenDuration'] = moment.utc().diff(this.config.lastLogged, "ms") + "ms";

        if (opts.contentsContext && _.get(this.config, "context.contents")) {
            formattedContext = _.isFunction(opts.contentsContext) ? opts.contentsContext(this.config.context.contents) : this.config.context.contents;
            if (_.isPlainObject(formattedContext)) {
                formattedContext = objectFormatter({
                    obj: formattedContext,
                });
            }
            line['contentsContext'] = formattedContext;
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

        //Otherwise we just display
        line.timestamp = new Date();
        line.args = {};
        line.message = '';
        if (level == "KPI") {
            line.message = args[1];
            line.kpi = args[2];
            delete line.args;
        } else {
            for (var i = 0; i < args.length; i++) {
                if (_.isBoolean(args[i]) || _.isString(args[i]) || _.isFinite(args[i]))
                    line.args[i] = (args[i].toString());
                else if (_.isFunction(args[i]))
                    line.args[i] = '[Function: ' + (args[i].name === '' ? 'anonymous' : args[i].name) + ']';
                else if (_.isRegExp(args[i]))
                    line.args[i] = args[i].toString();
                else if (_.isNull(args[i]))
                    line.args[i] = "null";
                else if (_.isUndefined(args[i]))
                    line.args[i] = "undefined";
                else if (_.isObject(args[i]))
                    line.args[i] = objectFormatter({obj: args[i]});
                if (args[i] instanceof Error)
                    line.message += args[i].stack + ' ';
                else if (_.isString(line.args[i])) {
                    line.message += line.args[i] + ' ';
                }
            }
        }

        if (level != 'PROGRESS')
            return {
                streamName: (level == "DEBUG" || level == "INFO" || level == "KPI") ? "stdout" : "stderr",
                output: JSON.stringify(_.isFunction(opts.extraFormatter) ? opts.extraFormatter(line) : line, null, 0) + '\n'
            };

        //process.stdout.write()
        //console.log(line);

    };

};