var dot = module.exports = {};

dot.graph = {
    charset: "UTF-8",
    labelloc: "t",
    labeljust: "r",
    style: "filled",
    rankdir: "LR",
    margin: 0.2,
    ranksep: 0.5,
    nodesep: 0.4
};
dot.node = {
    style: "solid",
    fontsize: 11,
    margin: "0.1,0.1",
    fontname: "Osaka-Mono,ＭＳ ゴシック",
};
dot.edge = {
    fontsize: 9,
    fontname: "Osaka-Mono,ＭＳ ゴシック",
    color: "#777777"
};

var tab = function(text, level) {
    var t = "";
    for (var i = 0; i < level; i++) {
        t += "\t";
    }
    t += text;
    return t;
};

var escapeQuote = function(text) {
    return '"' + (text + "").replace(/"/g, "\"") + '"';
};
var bs = /\\/g, pp = /\|/g, quote = /"/g, amp = /&/g, lt = /</g, gt = />/g, rchars = /[\\\|"&<>]/;
var escapeText = function(text) {
  if (!rchars.test(text)) {
    return text;
  }
  return text
    .replace(bs, '\\\\')
    .replace(pp, '\\|')
    .replace(quote, '\\"')
    .replace(amp, '&amp;')
    .replace(lt, '&lt;')
    .replace(gt, '&gt;');
};
var attributes = function(tabLevel, obj) {
    return Object.keys(obj).map(function(key) {
        return tab(key + " = " + escapeQuote(obj[key]), tabLevel);
    }).join(",\n");
};

var blanket = function(tabLevel, name, values) {
    return [
        tab(name, tabLevel) + "[",
        attributes(tabLevel + 1, values),
        tab("]", tabLevel)
    ].join("\n");
};

var nodeGlobal = function() {
    return blanket(1, "node", dot.node);
};
var graphGlobal = function() {
    return blanket(1, "graph", dot.graph);
};
var edgeGlobal = function() {
    return blanket(1, "edge", dot.edge);
};
var section = function(port, text) {
    return "<" + port + ">" + " " + text + "\\l ";
};

var runeWidth = function(str) {
    if (!str) {
        return 0;
    }
    var count = 0
    for (var i = 0, l = str.length; i < l; i++) {
        count += str.charCodeAt(i) <= 255 ? 1 : 2;
    }
    return count;
};
var maxRuneWidth = function(elm) {
    var nameWidth = runeWidth(elm.name);
    var maxSeeWith = Math.max.apply(null, elm.see.map(runeWidth));
    var maxActionWidth = Math.max.apply(null, elm.actions.map(function(a) {
        return Math.max.apply(null, a.text.map(runeWidth));
    }));
    return Math.max(nameWidth, maxSeeWith, maxActionWidth);
};
var runeToWidth = function(runeWidth) {
    var rw = (runeWidth <= 5) ? 5 : runeWidth;
    return rw / 13 + 0.2;
};
var treeToDotDef = function(tree) {
    return Object.keys(tree).map(function(key) {
        var elm = tree[key];
        var noActions = elm.actions.length === 1 && elm.actions[0].text.length === 0;
        var runeWidth = maxRuneWidth(elm);
        return blanket(1, nameOf(elm), {
            shape: "record",
            label: [
                section("title", escapeText(elm.name)),
                section("see", elm.see.map(escapeText).join("\\l")),
                noActions ? null : elm.actions.map(function(action, index) {
                    return section("action" + index, action.text.map(escapeText));
                }).join("|"),
            ].filter(function(r) {
                return !!r;
            }).join("|"),
            width: runeToWidth(runeWidth)
        });
    }).join("\n");
};

var arrow = function(from, to, label) {
    if (!label) {
        return tab(from + " -> " + to, 1);
    }
    return tab(from + " -> " + to + "[ label =" + escapeQuote(label) + "]", 1);
};

var nameOf = function(elm, port) {
    var escapedName = escapeQuote(elm.name);
    if (port) {
        return escapedName + ":" + port;
    }
    return escapedName;
};
var treeToDotArrow = function(tree) {
    return Object.keys(tree).map(function(key) {
        var elm = tree[key];
        return elm.actions.map(function(e, i) {
            if (!e.direction) {
                return "";
            }
            if (!tree[e.direction]) {
                return arrow(
                    nameOf(elm, "action" + i),
                    escapeQuote(e.direction),
                    e.edge
                );
            }
            return arrow(
                nameOf(elm, "action" + i),
                nameOf(tree[e.direction]),
                e.edge
            );
        }).join("\n");
    }).join("\n");
};

var treeToDotRank = function(tree) {
    var ranks = {};
    var result = "";
    Object.keys(tree).forEach(function(key) {
        var elm = tree[key];
        ranks[elm.rank] = ranks[elm.rank] ? ranks[elm.rank] : [];
        ranks[elm.rank].push(nameOf(elm));
    });
    Object.keys(ranks).forEach(function(key) {
        if (key == '1') {
            result += tab("{ rank = source;" + ranks[key].join(";") + ";}", 1);
            result += "\n";
            return;
        }
        if (key != '0') {
            result += tab("{ rank = same;" + ranks[key].join(";") + ";}", 1);
            result += "\n";
            return;
        }
    });
    return result;
};

dot.compile = function(tree) {
    return [
        "digraph D {",
        graphGlobal(),
        nodeGlobal(),
        edgeGlobal(),
        treeToDotDef(tree),
        treeToDotArrow(tree),
        treeToDotRank(tree),
        "}"
    ].join("\n");
};
