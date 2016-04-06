var _ = require("lodash");

//CustomError("codeString", "my message", "next hello", 404, {info:"hello"}, {otherInfo:3}, "warning");
function CustomError() {
    var codeString, message, code = 500, info, level = "fatal";
    for (var i = 0; i < arguments.length; i++) {
        //Deal with string arguments
        if (_.isString(arguments[i]) && arguments[i].length > 0) {
            if (arguments[i] == "fatal" || arguments[i] == "warning" || arguments[i] == "notice")
                level = arguments[i];
            else if (arguments[i].length < 35 && _.camelCase(arguments[i]) == arguments[i])
                codeString = arguments[i];
            else // a message
            {
                if (!message)
                    message = arguments[i];
                else
                    message += " " + arguments[i];
            }
        }
        else if (_.isFinite(arguments[i]))
            code = arguments[i];
        else if (_.isPlainObject(arguments[i])) {
            if (!info)
                info = {};
            _.extend(info, arguments[i]);
        }
    }
    var temp = Error.call(this, message || codeString);
    temp.name = this.name = 'Error';
    this.stack = temp.stack;
    this.level = level; //notice,warning,fatal
    this.codeString = codeString;
    this.code = code;
    this.message = message || codeString; //a human-readable message
    this.info = info;
}

CustomError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: CustomError,
        writable: true,
        configurable: true
    }
});

CustomError.prototype.use = function use(err) {
    if (err instanceof Error) {
        err.message && (this.message = err.message);
        err.stack && (this.stack = err.stack);
        err.codeString = (this.codeString = err.codeString);
        err.code && (this.code = err.code);
        err.level = (this.level = err.level);
        if (err.info) {
            if (this.info)
                _.extend(this.info, err.info)
            else
                this.info = err.info;
        }
        if (err.extra) {
            if (this.info)
                _.extend(this.info, err.extra)
            else
                this.info = err.extra;
        }
    }
    else if (_.isPlainObject(err)) {
        if (this.info)
            _.extend(this.info, err)
        else
            this.info = err;
    }
    return this;
};

CustomError.prototype.toObject = function toObject() {
    return {
        error: {
            message: this.message,
            level: this.level,
            stack: this.stack,
            codeString: this.codeString,
            code: this.code,
            info: this.info
        }
    };
};

module.exports = CustomError;