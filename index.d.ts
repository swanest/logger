/*
 Logger & CustomError Declarations
 */
declare namespace D {

    namespace Formatters {
        namespace Common {
            type level = "FATAL" | "ERROR" | "WARNING" | "INFO" | "DEBUG" | "PROGRESS";
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
                namespace?: boolean | string | ((namespace: string)=>string);
                namespaceColor?: "black" | "blue" | "cyan" | "green" | "magenta" | "white" | "red" | "yellow" | "inverse" | "underline" | "italic" | "bold";
                linesBetweenLogs?: number;
                environment?: boolean | string | ((environment: string)=>string);
                contentsContext?: boolean | ((contextContents: Object)=>(Object | string));
                idContext?: boolean;
                level: boolean | ((level: string)=>string);
                pid: boolean;
                date: boolean | string | (()=>string);
                inBetweenDuration?: boolean;
                displayLineNumber?: boolean | {rootDirName: string};
                arraySampling?: number;
            }
            interface Generator {
                (opts?: Options): Formatter;
            }
        }
        namespace Json {
            interface Format extends Common.Format {
                streamName: "stdout" | "stderr";
                output: string
            }
            interface Formatter extends Common.Formatter {
                (args: any, level: Common.level): Format;
            }
            interface Options {
                internalPrefix?: string;
                namespace?: boolean | string | ((namespace: string)=>string);
                environment?: boolean | string | ((environment: string)=>string);
                contentsContext?: boolean | ((contextContents: Object)=>(Object | string));
                idContext?: boolean;
                level: boolean | ((level: string)=>string);
                pid: boolean;
                inBetweenDuration?: boolean;
                displayLineNumber?: boolean | {rootDirName: string};
                extraFormatter?: (obj: Object)=>Object
            }
            interface Generator {
                (opts?: Options): Formatter;
            }
        }
    }

    namespace Streams {
        interface Stream {
            write(data: Formatters.Common.Format): void;
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
                PROGRESS: boolean;
            };
        }
        interface stdOutStreamConfig extends StreamConfig {
            formatter: Formatters.Beautiful.Formatter | Formatters.Json.Formatter;
        }
        interface Setup {
            namespace: string;
            environment?: string;
            context?: {id?: string; contents: Object};
            streams?: {
                stdOut?: stdOutStreamConfig;
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

    public config: D.Config.Setup;
    public buffer: Array<any>;
    public bufferMode: boolean;
    public children: Array<Logger>;
    public parent: void | Logger;

    constructor(config?: D.Config.Setup);

    enable(recursive?: boolean): this

    disable(recursive?: boolean): this

    startBuffer(recursive?: boolean): this

    releaseBuffer(recursive?: boolean): this

    debug(...args: Array<any>): this

    log(...args: Array<any>): this

    info(...args: Array<any>): this

    warning(...args: Array<any>): this

    warn(...args: Array<any>): this

    error(...args: Array<any>): this

    err(...args: Array<any>): this

    fatal(...args: Array<any>): this

    kpi(name: string): this

    progress(decimal?: number): this

    copy(overloadConfig?: D.Config.Setup): Logger

    context(id?: string): Logger
    context(contents?: Object, id?: string): Logger

    unlink(): this


    addStream(label: string, streamConfig: D.Config.StreamConfig): this

    removeStream(...labels: Array<string>): this
}

export var formatters: {
    readonly beautiful: D.Formatters.Beautiful.Generator
    readonly json: D.Formatters.Json.Generator
};

export var streams: {
    readonly stdout: D.Streams.Stream
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
    info: any;

    constructor(codeString?: string, message?: string, ...more: Array<any>);
    constructor(code?: number, codeString?: string, level?: "fatal"|"warning"|"notice");

    toObject(filter?: ((err: this)=>D.CustomErrorPlainObject)): D.CustomErrorPlainObject

    toJSON(filter?: ((err: this)=>D.CustomErrorPlainObject)): D.CustomErrorPlainObject

    use(...items: Array<any>): this

    override(...items: Array<any>): this


}
