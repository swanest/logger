module.exports = { //stream object
    write: function (o) {
        try {
            process[o.streamName].write(o.output);
        } catch (e) {
        }
    }

};