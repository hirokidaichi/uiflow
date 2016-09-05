var fs = require("fs");
var stream = require("stream");
var parser = require("./app/parser");
var dot = require("./app/dotwriter");
var graphviz = require("./app/graphviz");
var stringStream = require("string-to-stream");
var streamFromPromise = require("stream-from-promise");
var through2 = require("through2");
//var reduce = require("through2-reduce");
/*
 plugin : function(fileName,format) -> stream

 png := slurp | parse | dot | graphviz(png)

*/
var uiflow = module.exports = {};

var slurp = function(fileName) {
    var content = "";
    return through2.obj(function(chunk, enc, callback) {
        content += chunk;
        callback();
    }, function() {
        this.push({
            content: content,
            fileName: fileName
        });
    });
};

var pass = function(obj) {
    var start = stringStream("something");
    return start.pipe(through2.obj(function(chunk, enc, callback) {
        this.push(obj);
        callback();
    }));
};

var print = function() {
    return through2.obj(function(chunk, enc, cb) {
        console.error(chunk);
        this.push(chunk);
        cb();
    });
};
var parse = function() {
    return through2.obj(function(chunk, enc, callback) {
        try {
            var output = parser.parse(String(chunk.content), chunk.fileName);
            this.push(output);
        } catch (e) {
            callback(e);
            return;
        }
        callback();
    });
};
var complete = function() {
    return through2.obj(function(parsed, enc, callback) {
        var sections = [];
        Object.keys(parsed).forEach(function(key) {
            var elm = parsed[key];
            (elm.actions || []).forEach(function(a) {
                if (a.direction && !parsed[a.direction]) {
                    sections.push(a.direction);
                }
            });
        });
        var output = sections.map(function(s) {
            return "[" + s + "]";
        }).join("\n\n");
        this.push(output);
        callback();
    });

};

var compile = function() {
    return through2.obj(function(chunk, enc, callback) {
        try {
            var output = dot.compile(chunk);
            this.push(output);
        } catch (e) {
            console.log(e);
            callback(e);
            return;
        }
        this.emit("end");
        callback();
    });
};
var jsonize = function() {
    return through2.obj(function(chunk, enc, callback) {
        var output = JSON.stringify(chunk, null, "  ");
        this.push(output);
        callback();
    });
};

var FORMAT_TO_PIPELINE = uiflow.FORMAT_TO_PIPELINE = {
    dot: [parse, compile],
    meta: [parse, jsonize],
    json: [parse, jsonize],
    png: [parse, compile, graphviz("png")],
    svg: [parse, compile, graphviz("svg")],
};

uiflow.DOT_PATH = "dot";
uiflow.parser = parser;
uiflow.dotwriter = dot;
uiflow.compile = function(d) {
    return dot.compile(parser.parse(d));
};

uiflow.build = function(fileName, format, handleError) {
    var stream = fs.createReadStream(fileName).pipe(slurp(fileName));
    return composeStream(stream, format, handleError);
};

var composeStream = function(stream, format, handleError) {
    var pipes = FORMAT_TO_PIPELINE[format];
    if (!pipes) {
        throw new Error("undefined format");
    }
    var ret = pipes.reduce(function(acc, n) {
        var next = n();
        //console.log(typeof next);
        if (handleError) next.on("error", handleError);
        return acc.pipe(next);
    }, stream);
    return ret;

};
uiflow.buildWithCode = function(fileName, code, format, handleError) {
    var stream = pass({
        fileName: fileName,
        content: code
    });
    return composeStream(stream, format, handleError);
};
