module.exports = { //stream object
    write: function (s) {
        try {
            process.stdout.write(s);
        } catch (e) {
        }
    }

};