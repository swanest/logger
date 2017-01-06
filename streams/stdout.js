// let streamsToConsole = {
//     stderr: "error",
//     stdout: "log"
// };

module.exports = { //stream object
    write: function (o) {
        try {
            //console.log(o);
            //process[o.streamName].write(o.output);
            if (o.clear) {
                process.stdout.cursorTo(0);
                process.stdout.clearLine(1);
            }
            process.stdout.write(o.output);
        } catch (e) {
        }
    }
};