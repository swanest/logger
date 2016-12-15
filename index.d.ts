declare namespace Types {
    /*
     Logger declarations
     */
    namespace Logger {
        namespace Formatters {
            namespace Common {
                type level = "FATAL" | "ERROR" | "WARNING" | "INFO" | "DEBUG";
                interface Format {
                }
                interface Formatter {
                }
            }
            namespace Beautiful {
                interface Format extends String, Common.Format {
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
    }


    /*
     CustomError declarations
     */
    namespace CustomError {
        interface CustomErrorPlainObject{
            error:{
                message:string;
                level:"fatal"|"warning"|"notice";
                stack?:string;
                codeString:string;
                code:number;
                info?:Object;
                isCustomError:true
            }
        }
    }


}


//Logger exports
export declare class Logger {
    constructor(config?: Types.Logger.Config.Setup);

    enable(): this

    disable(): this

    config(config?: Types.Logger.Config.Setup): this

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

    copy(overloadConfig?: Types.Logger.Config.Setup): Logger

    context(id: string): Logger
    context(contents: Object, id: string): Logger

    addStream(label: string, streamConfig: Types.Logger.Config.StreamConfig): this

    removeStream(...labels: Array<string>): this
}

export var formatters: {
    beautiful: Types.Logger.Formatters.Beautiful.Generator,
    rollbar: Types.Logger.Formatters.Rollbar.Generator
};

export var streams: {
    stdout: Types.Logger.Streams.Stream
    rollbar: Types.Logger.Streams.Rollbar.Generator
};

//CustomError exports
export declare class CustomError extends Error {
    constructor(codeString?: string, message?: string, ...more: Array<any>);
    constructor(codeString?: string, message?: string, code?: number, level?: "fatal"|"warning"|"notice", ...more: Array<any>);
    toObject(filter?:((err:this)=>Types.CustomError.CustomErrorPlainObject)):Types.CustomError.CustomErrorPlainObject
    toJSON(filter?:((err:this)=>Types.CustomError.CustomErrorPlainObject)):Types.CustomError.CustomErrorPlainObject
    use(e:Error | Types.CustomError.CustomErrorPlainObject):this
}