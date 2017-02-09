// let streamsToConsole = {
//     stderr: "error",
//     stdout: "log"
// };

module.exports = { //stream object
    write: function (o) {
        if (o == void 0)
            return;
        try {
            if (o.clear) {
                process.stdout.cursorTo(0);
                process.stdout.clearLine(1);
            }
            process.stdout.write(o.output);
            //console.log(o.output);
        } catch (e) {

        }
    }
};