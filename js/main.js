"use strict";

$(document).ready(function() {

    var canvas = document.getElementById("myCanvas");
    var global = {
        //canvas: document.getElementById("myCanvas"),
        context: canvas.getContext("2d"),
        isDrawing: false,
        isEraser: false
    };

    var drawing = {
        shapes: [],
        redo: [],
        nextObject: "Pen",
        nextColor: "black",
        tempColor: "black",
        nextWidth: 2
    };

    var Shape = Base.extend({
       constructor: function(x, y, color, type, thickness) {
           this.x = x;
           this.y = y;
           this.endX = x;
           this.endY = y;
           this.type = type;
           this.color = color;
           this.thickness = thickness;
           this.selected = false;
       },
        calcBounds: function() {
            var minX = Math.min(this.x, this.endX);
            var minY = Math.min(this.y, this.endY);
            var width = Math.abs(this.endX - this.x);
            var height = Math.abs(this.endY - this.y);

            return new Rectangle(minX, minY, width, height);
        }
    });

    var Pen = Shape.extend( {
        constructor: function(x, y, color, thick) {
            this.base(x, y, color, "Pen", thick);
            this.clickX = [];
            this.clickY = [];
        },

        addClick: function(x, y) {
            this.clickX.push(x);
            this.clickY.push(y);
        },

        draw: function(global) {
            this.addClick(this.endX, this.endY);
            global.context.strokeStyle = this.color;
            global.context.lineWidth = this.thickness;
            global.context.lineJoin = "round";
            global.context.beginPath();
            global.context.moveTo(this.clickX[0], this.clickY[0]);
            for(var i = 0; i < this.clickX.length; i++) {
                global.context.lineTo(this.clickX[i], this.clickY[i]);
                global.context.stroke();
            }
        }
    });

    var Line = Shape.extend( {
        constructor: function(x, y, color, thick) {
           this.base(x, y, color, "Line", thick);
        },

        draw: function(global) {
            global.context.strokeStyle = this.color;
            global.context.lineWidth = this.thickness;
            global.context.beginPath();
            global.context.moveTo(this.x, this.y);
            global.context.lineTo(this.endX, this.endY);
            global.context.stroke();
        }
    });

    var Rect = Shape.extend( {
        constructor: function(x, y, color, thick) {
         this.base(x, y, color, "Rect", thick);
        },
        // TODO spyrja Hauk um þetta global drasl
        draw: function(global) {
            global.context.strokeStyle = this.color;
            global.context.lineWidth = this.thickness;
            var bounds = this.calcBounds();
            global.context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
    });

    var Circle = Shape.extend( {
        constructor: function(x, y, color, thick) {
            this.base(x, y, color, "Circle", thick);
        },

        draw: function(global) {
            global.context.strokeStyle = this.color;
            global.context.lineWidth = this.thickness;
            var bounds = this.calcBounds();
            var kappa = .5522848,
                ox = (bounds.width / 2) * kappa,
                oy = (bounds.height / 2) * kappa,
                xe = bounds.x + bounds.width,
                ye = bounds.y + bounds.height,
                xm = bounds.x + bounds.width / 2,
                ym = bounds.y + bounds.height / 2;

            global.context.beginPath();
            global.context.moveTo(bounds.x, ym);
            global.context.bezierCurveTo(bounds.x, ym - oy, xm - ox, bounds.y, xm, bounds.y);
            global.context.bezierCurveTo(xm + ox, bounds.y, xe, ym - oy, xe, ym);
            global.context.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
            global.context.bezierCurveTo(xm - ox, ye, bounds.x, ym + oy, bounds.x, ym);
            global.context.stroke();

        }
    });

    var Text = Shape.extend( {
        constructor: function(x, y, color, thick) {
            // ToDo: Fix this shit
            this.base(x, y, color, "Text", thick);
        },

        draw: function(global) {

        }
    });

    $(".toolButton").click(function(event) {
        var tool = $(this).attr("data-toolType");
        if(tool === "Eraser") {
            drawing.tempColor = drawing.nextColor;
            drawing.nextColor = "white";
            createShape = createPen;
            drawing.isEraser = true;
        }
        else {
            var temp = "create" + tool;
            var fun = eval(temp);
            createShape = fun;
            drawing.isEraser = false;
        }
    });

    $(".colorButton").click(function(event) {
        if(drawing.isEraser) {
            drawing.nextColor = "white";
        }
        else {
            drawing.nextColor = $(this).attr("data-color");
        }
    });

    $(".thickButton").click(function(event) {
        drawing.nextWidth = parseInt($(this).attr("data-thickness"));
    });
//
    $("#clearButton").click(function(event) {
        drawing.shapes.length = 0;
        global.context.clearRect(0, 0, canvas.width, canvas.height);

    });

    $("#undoButton").click(function(event) {
        var temp = drawing.shapes.pop();
        if(temp !== undefined) {
            drawing.redo.push(temp);
        }
        render();
    });

    $("#redoButton").click(function(event) {
        /*if (typeof drawing.redo !== 'undefined' && drawing.redo.length > 0) {
            drawing.shapes.push(drawing.redo.pop());
        }*/
        var temp = drawing.redo.pop();
        if(temp !== undefined) {
            drawing.shapes.push(temp);
        }
        render();
    });

    $("#myCanvas").mousedown(function(e){
        if(drawing.nextColor === "white" && !drawing.isEraser) {
            drawing.nextColor = drawing.tempColor;
        }

        var x = e.pageX - this.offsetLeft;
        var y = e.pageY - this.offsetTop;
        global.isDrawing = true;
        global.justClicked = true;

        var temp = createShape(x,y);
        if(temp !== undefined) {
            drawing.shapes.push(temp);
        }
    });

    $("#myCanvas").mousemove(function(e){
        if(global.isDrawing) {
            var x = e.pageX - this.offsetLeft;
            var y = e.pageY - this.offsetTop;

            drawing.shapes[drawing.shapes.length - 1].endX = x;
            drawing.shapes[drawing.shapes.length - 1].endY = y;
            render();
            drawing.shapes[drawing.shapes.length - 1].draw(global);
        }
    });

    $("#myCanvas").mouseup(function(e){

        var x = e.pageX - this.offsetLeft;
        var y = e.pageY - this.offsetTop;

        drawing.shapes[drawing.shapes.length - 1].endX = x;
        drawing.shapes[drawing.shapes.length - 1].endY = y;

        global.isDrawing = false;
    });

    $("#myCanvas").mouseleave(function(e) {
        global.isDrawing = false;
    });



    function createPen(x, y) {
        return new Pen(x, y, drawing.nextColor, drawing.nextWidth);
    }

    function createLine(x, y) {
        return new Line(x, y, drawing.nextColor, drawing.nextWidth);
    }

    function createRect(x, y) {
        return new Rect(x, y, drawing.nextColor, drawing.nextWidth);
    }

    function createCircle(x, y) {
        return new Circle(x, y, drawing.nextColor, drawing.nextWidth);
    }

    function createText(x, y) {
        //TODO fix this ish
        return new Text(x, y, drawing.nextColor, drawing.nextWidth);
    }

    var createShape = createPen;

    function render() {
        global.context.clearRect(0, 0, canvas.width, canvas.height);
        for(var i = 0; i < drawing.shapes.length; i++) {
            drawing.shapes[i].draw(global);
        }
    }

    function Rectangle(x, y, width, height) {
        this.x = x,
        this.y = y,
        this.width = width,
        this.height = height
    }
});