const BASES = ["A", "C", "G", "T"];
const ACIDS = {
    A: {
        A: "---",
        C: "cut",
        G: "del",
        T: "swi"
    },
    C: {
        A: "mvr",
        C: "mvl",
        G: "cop",
        T: "off"
    },
    G: {
        A: "ina",
        C: "inc",
        G: "ing",
        T: "int"
    },
    T: {
        A: "rpy",
        C: "rpu",
        G: "lpy",
        T: "lpu"
    }
};

const LEFT_MARGIN = 20;
const TEXTSIZE = 20;

function makeRandomStrand() {
    var strandLength = Math.floor(Math.random() * 16) + 15;
    var strand = [];
    for (var i = 0; i < strandLength; i++) {
        var baseNumber = Math.floor(Math.random() * 4);
        var base = BASES[baseNumber];
        strand.push(base);
    }
    return strand;
}

function translateStrand(strand) {
    var enzyme = [];
    // We're skipping by 2, and we want to ignore the last base if the strand has an odd number of bases, so if the program is on the last base, it ends the loop
    for (var i = 0; i < strand.length - 1; i += 2) {
        var currentBase = strand[i];
        var nextBase = strand[i + 1];
        var acid = ACIDS[currentBase][nextBase];
        enzyme.push(acid);
    }
    return enzyme;
}

function doDelete(strand, strandDivs, index) {
    var strandDiv = strandDivs[index];
    strand.splice(index, 1);
    strandDiv.fadeOut();
    strandDivs.splice(index, 1);
    
    var strandDivsToMove = strandDivs.slice(index);
    
    return strandDiv.promise().then(function () {
        var promises = strandDivsToMove.map(function (div) {
            div.animate({ left: "-=" + TEXTSIZE });
            return div.promise();
        });
        return $.when.apply($, promises);
    });
}

function doMove(newIndex, markerDiv) {
    markerDiv.animate({ left: (LEFT_MARGIN + TEXTSIZE*newIndex) + "px"});
    return markerDiv.promise();
}

function doInsert(strand, strandDivs, index, base) {
    strand.splice(index + 1, 0, base);

    var strandDivsToMove = strandDivs.slice(index + 1);
    
    var promises = strandDivsToMove.map(function (div) {
        div.animate({ left: "+=" + TEXTSIZE });
        return div.promise();
    });
    return $.when.apply($, promises).then(function () {
        var newDiv = makeStrandDiv(index + 1, base);
        newDiv.fadeIn();
        strandDivs.splice(index + 1, 0, newDiv);
        return newDiv.promise();
    });    
    return new $.Deferred().resolve().promise();
}

function doOperation(operation, strand, strandDivs, markerDiv, index) {
    var promise;
    switch (operation) {
        case "del":
            promise = doDelete(strand, strandDivs, index);
            break;
        case "mvr":
            index++;
            promise = doMove(index, markerDiv);
            break;
        case "mvl":
            index--;
            promise = doMove(index, markerDiv);
            break;
        case "ina":
            promise = doInsert(strand, strandDivs, index, "A");
            break;
        case "inc":
            promise = doInsert(strand, strandDivs, index, "C");
            break;
        case "ing":
            promise = doInsert(strand, strandDivs, index, "G");
            break;
        case "int":
            promise = doInsert(strand, strandDivs, index, "T");
            break;
        case "rpy":
            index++;
            while (index < strand.length && strand[index] !== "C" && strand[index] !== "T") {
                index++;
            }
            promise = doMove(index, markerDiv);
            break;
        case "rpu":
            index++;
            while (index < strand.length && strand[index] !== "A" && strand[index] !== "G") {
                index++;
            }
            promise = doMove(index, markerDiv);
            break;
        case "lpy":
            index--;
            while (index >= 0 && strand[index] !== "C" && strand[index] !== "T") {
                index--;
            }
            promise = doMove(index, markerDiv);
            break;
        case "lpu":
            index--;
            while (index >= 0 && strand[index] !== "A" && strand[index] !== "G") {
                index--;
            }
            promise = doMove(index, markerDiv);
            break;
        default:
            console.log("Unhandled operation", operation);
            promise = new $.Deferred().resolve().promise();
            break;
    }
    return {
        strand: strand,
        index: index,
        promise: promise
    }; 
}

function makeStrandDiv(index, base) {
    return $("<div>")
        .addClass("strandBase")
        .css({
            position: "absolute",
            top: "100px",
            left: (LEFT_MARGIN + TEXTSIZE*index) + "px"
        })
        .text(base)
        .appendTo($("body"));
}

function makeStrandDivs(strand) {
    var strandDivs = [];
    for (var i = 0; i < strand.length; i++) {
        var div = makeStrandDiv(i, strand[i]);
        strandDivs.push(div);
    }
    return strandDivs;
}


function makeMarkerDiv() {
    var markerDiv = $("<div>")
    .addClass("marker")
    .css({
        position: "absolute",
        top: "120px",
        left: "0px"
    })
    .text("\u25B2")
    .appendTo($("body"));
    return markerDiv;
}

function moveMarkerDiv(index, markerDiv) {
    markerDiv.css({
        left: (LEFT_MARGIN + TEXTSIZE*index) + "px"
    });
}

var markerDiv;
var strandDivs;

var currentStrand = makeRandomStrand();
var currentEnzyme = translateStrand(currentStrand);
var currentIndex = Math.floor(currentStrand.length/2);
document.write(currentStrand.join(""));
document.write("<br/>");
document.write(currentEnzyme.join(" => "));
document.write("<br/>");
strandDivs = makeStrandDivs(currentStrand);
markerDiv = makeMarkerDiv();
moveMarkerDiv(currentIndex, markerDiv);

function doNextOperation(operationIndex) {
    var operation = currentEnzyme[operationIndex];
    var result = doOperation(operation, currentStrand, strandDivs, markerDiv, currentIndex);
    currentIndex = result.index;
    currentStrand = result.strand;
    result.promise.then(function () {
        if (operationIndex < currentEnzyme.length) {
            doNextOperation(operationIndex + 1);
        }
    });
}

doNextOperation(0);

//    document.write("<br/>");
//    document.write(operation);
//    document.write(currentIndex);
//    document.write("<br/>");
//    document.write(result.strand.join(""));
//    document.write("<br/>");
