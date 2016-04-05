module.exports = {
    write: function (s) {
        try {
            process.stdout.write(s);
        } catch (e) {
        }
    }

};