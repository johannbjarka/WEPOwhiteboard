"use strict";

$(document).ready(function() {

    var canvas = document.getElementById("myCanvas");
    var global = {
        //canvas: document.getElementById("myCanvas"),
        context: canvas.getContext("2d"),
        isDrawing: false
    };

    var drawing = {
        shapes: [],
        nextObject: "Pen",
        nextColor: "black",
        nextWidth: "small",

        drawAll: function drawAll() {
            for (var i = 0; i < shapes.length; ++i) {
                shapes[i].draw(/* TODO: there will be some parameters here...*/);
            }
        }
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
       },
        draw: function(global) {

        }
    });

    var Line = Shape.extend( {
       constructor: function(x, y, color, thick) {
           this.base(x, y, color, "Line", thick);
       }
    });

    var Rect = Shape.extend( {
       constructor: function(x, y, color, thick) {
         this.base(x, y, color, "Rect", thick);
       },
        // TODO spyrja Hauk um þetta global drasl
        draw: function(global) {
            global.context.strokeStyle = this.color;
            global.context.lineWidth = this.thick;
            var bounds = this.calcBounds();
            global.context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
    });

    var Circle = Shape.extend( {
        constructor: function(x, y, color, thick) {
            this.base(x, y, color, "Circle", thick);
        },

        draw: function(global) {

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

    var Eraser = Shape.extend( {
        constructor: function(x, y, thick) {
            this.base(x, y, "White", "Eraser", thick);
        },

        draw: function(global) {

        }
    });

    $(".toolButton").click(function(event) {
        var tool = $(this).attr("data-toolType");
        var temp = "create" + tool;
        var fun = eval(temp);
        createShape = fun;
    });

    $(".colorButton").click(function(event) {
        drawing.nextColor = $(this).attr("data-color");
    });

    $(".thickButton").click(function(event) {
        drawing.nextWidth = $(this).attr("data-thickness");
    });
//
    $("#clearButton").click(function(event) {
        drawing.shapes.length = 0;
        global.context.clearRect(0, 0, canvas.width, canvas.height);
    });

    $("#myCanvas").mousedown(function(e){
        var x = e.pageX - this.offsetLeft;
        var y = e.pageY - this.offsetTop;
        global.isDrawing = true;

        var temp = createShape(x,y);
        if(temp !== undefined) {
            drawing.shapes.push(temp);
        }
        /*
         context.beginPath();
         context.moveTo(0, 0);
         context.lineTo(x, y);
         context.stroke();

         context.fillStyle = "blue";
         context.fillRect(x - 30, y - 30, 60, 60);
         context.strokeRect(x - 30, y - 30, 60, 60);
         context.strokeStyle = "red";
         context.beginPath();
         context.moveTo()
         //console.log("X: " + x + " " + "Y: " + y);
         */
    });

    $("#myCanvas").mousemove(function(e){
        if(global.isDrawing) {
            var x = e.pageX - this.offsetLeft;
            var y = e.pageY - this.offsetTop;

            drawing.shapes[drawing.shapes.length - 1].endX = x;
            drawing.shapes[drawing.shapes.length - 1].endY = y;

            render();
            drawing.shapes[drawing.shapes.length - 1].draw(global);
            /*var x = e.pageX - this.offsetLeft;
            var y = e.pageY - this.offsetTop;
            global.context.strokeStyle = drawing.nextColor;
            global.context.clearRect(0, 0, 500, 500);
            global.context.beginPath();
            global.context.moveTo(global.startX, global.startY);
            global.context.lineTo(x, y);
            global.context.stroke();*/
        }

    });

    $("#myCanvas").mouseup(function(e){

        var x = e.pageX - this.offsetLeft;
        var y = e.pageY - this.offsetTop;

        drawing.shapes[drawing.shapes.length - 1].endX = x;
        drawing.shapes[drawing.shapes.length - 1].endY = y;
        /*global.context.beginPath();
        global.context.moveTo(x, y);
        global.context.lineTo(x, y);
        global.context.stroke();*/

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

    function createEraser(x, y) {
        return new Eraser(x, y, drawing.nextColor, drawing.nextWidth);
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