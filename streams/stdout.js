// let streamsToConsole = {
//     stderr: "error",
//     stdout: "log"
// };

module.exports = { //stream object
    write: function (o) {
        try {
            //console.log(o);
            //process[o.streamName].write(o.output);
            process.stdout.write(o.output);
        } catch (e) {
        }
    }

};