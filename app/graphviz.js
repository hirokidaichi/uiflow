var viz = require("viz.js");
var through2 = require("through2");
var spawnStream = require("spawn-stream");
var graphviz = module.exports = function(format) {
    if (format == "png") {
        return function() {

            return spawnStream("dot", ["-T", format]);
            //return spawnStream(uiflow.DOT_PATH, ["-T", format]);
        };
    }
    if (format == "svg") {
        return function() {
            return through2(function(chunk, enc, callback) {
                var svg = viz(String(chunk));
                this.push(svg);
                callback();
            });
        }
    }

};
