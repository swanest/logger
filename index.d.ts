/*
 Logger & CustomError Declarations
 */
declare namespace D {
    namespace Formatters {
        namespace Common {
            type level = "FATAL" | "ERROR" | "WARNING" | "INFO" | "DEBUG";
            interface Format {
            }
            interface Formatter {
            }
        }
        namespace Beautiful {
            interface Format extends Common.Format {
                streamName: "stdout" | "stderr";
                output: string
            }
            interface Formatter extends Common.Formatter {
                (args: any, level: Common.level): Format;
            }
            interface Options {
                namespace: boolean | string | ((namespace: string)=>string);
                namespaceColor?: "black" | "blue" | "cyan" | "green" | "magenta" | "white" | "red" | "yellow" | "inverse" | "underline" | "italic" | "bold";
                linesBetweenLogs: number;
                environment: boolean | string | ((environment: string)=>string);
                contentsContext: boolean | ((contextContents: Object)=>(Object | string));
                idContext: boolean;
                level: boolean | ((level: string)=>string);
                pid: boolean;
                date: boolean | string | (()=>string);
                inBetweenDuration: boolean;
            }
            interface Generator {
                (opts?: Options): Formatter;
            }
        }
        namespace Rollbar {
            interface Format extends Common.Format {
                error?: Error | null | undefined;
                level: "critical" | "error" | "warning" | "info" | "debug";
                custom: Object,
                message: string
            }
            interface Formatter extends Common.Formatter {
                (args: any, level: Common.level): Format;
            }
            interface Generator {
                (): Formatter;
            }
        }
    }
    namespace Streams {
        interface Stream {
            write(data: Formatters.Common.Format): void;
        }
        namespace Rollbar {
            interface Generator {
                (apiKey: string, environment: string): Stream;
            }
        }
    }
    namespace Config {
        interface StreamConfig {
            formatter?: Formatters.Common.Formatter
            stream?: Streams.Stream;
            levels?: {
                DEBUG: boolean;
                INFO: boolean;
                WARNING: boolean;
                ERROR: boolean;
                FATAL: boolean;
            };
        }
        interface stdOutStreamConfig extends StreamConfig {
            formatter: Formatters.Beautiful.Formatter;
        }
        interface rollbarStreamConfig extends StreamConfig {
            formatter: Formatters.Rollbar.Formatter
        }
        interface Setup {
            namespace: string;
            environment?: string;
            context?: {id?: string; contents: Object};
            streams?: {
                stdOut?: stdOutStreamConfig;
                rollbar?: rollbarStreamConfig;
            };
        }
    }

    /*
     CustomError PlainObject scheme
     */
    interface CustomErrorPlainObject {
        error: {
            message: string;
            level: "fatal"|"warning"|"notice";
            stack?: string;
            codeString: string;
            code: number;
            info?: Object;
            isCustomError: true
        }
    }

}


//Logger exports
export declare class Logger {
    constructor(config?: D.Config.Setup);

    enable(): this

    disable(): this

    config(config?: D.Config.Setup): this

    startBuffer(): this

    releaseBuffer(): this

    debug(...args: Array<any>): this

    log(...args: Array<any>): this

    info(...args: Array<any>): this

    warning(...args: Array<any>): this

    warn(...args: Array<any>): this

    error(...args: Array<any>): this

    err(...args: Array<any>): this

    fatal(...args: Array<any>): this

    copy(overloadConfig?: D.Config.Setup): Logger

    context(id: string): Logger
    context(contents: Object, id: string): Logger

    addStream(label: string, streamConfig: D.Config.StreamConfig): this

    removeStream(...labels: Array<string>): this
}

export var formatters: {
    readonly beautiful: D.Formatters.Beautiful.Generator,
    readonly rollbar: D.Formatters.Rollbar.Generator
};

export var streams: {
    readonly stdout: D.Streams.Stream
    readonly rollbar: D.Streams.Rollbar.Generator
};

//CustomError exports
export declare class CustomError extends Error {

    name: 'Error';
    isCustomError: true;
    stack: string;
    level: "notice" | "warning" | "fatal"; //notice,warning,fatal
    codeString: "string";
    code: number;
    message: string; //a human-readable message
    info: Object;

    constructor(codeString?: string, message?: string, ...more: Array<any>);
    constructor(codeString?: string, message?: string, code?: number, level?: "fatal"|"warning"|"notice", ...more: Array<any>);

    toObject(filter?: ((err: this)=>D.CustomErrorPlainObject)): D.CustomErrorPlainObject

    toJSON(filter?: ((err: this)=>D.CustomErrorPlainObject)): D.CustomErrorPlainObject

    use(e: Error | D.CustomErrorPlainObject): this
}