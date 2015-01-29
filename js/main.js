"use strict";

$(document).ready(function() {

    var canvas = document.getElementById("myCanvas");
    var global = {
        //canvas: document.getElementById("myCanvas"),
        context: canvas.getContext("2d"),
        isDrawing: false,
        isEraser: false,
        isMoving: false,
        dragX: 0,
        dragY: 0,
        dragEndX: 0,
        dragEndY: 0,
        startX: 0,
        startY: 0,
        selectedObject: null,
        selectedTool: "Pen"
    };

    var drawing = {
        shapes: [],
        redo: [],
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
        },
        isInShape: function(x, y) {
            var bounds = this.calcBounds();
            if(x >= bounds.x && x <= bounds.x + bounds.width
                && y >= bounds.y && y <= bounds.y + bounds.height) {
                return true;
            }
            else {
                return false;
            }
        }
    });

    var Pen = Shape.extend( {
        constructor: function(x, y, color, thick) {
            this.base(x, y, color, "Pen", thick);
            this.clickX = [];
            this.clickY = [];
            this.tempX = [];
            this.tempY = [];
        },

        addClick: function(x, y) {
            this.clickX.push(x);
            this.clickY.push(y);
        },

        draw: function(global) {
            global.context.strokeStyle = this.color;
            global.context.lineWidth = this.thickness;
            global.context.lineJoin = "round";
            global.context.beginPath();
            global.context.moveTo(this.clickX[0], this.clickY[0]);
            for(var i = 0; i < this.clickX.length; i++) {
                global.context.lineTo(this.clickX[i], this.clickY[i]);
                global.context.stroke();
            }
        },
        calcBounds: function() {
            var minX = canvas.width;
            var minY = canvas.height;
            var maxX = 0;
            var maxY = 0;
            for(var i = 0; i < this.clickX.length; i++) {
                if(this.clickX[i] < minX) {
                    minX = this.clickX[i];
                }
                if(this.clickX[i] > maxX) {
                    maxX = this.clickX[i];
                }
                if(this.clickY[i] < minY) {
                    minY = this.clickY[i];
                }
                if(this.clickY[i] > maxY) {
                    maxY = this.clickY[i];
                }
            }
            return new Rectangle(minX, minY, maxX - minX, maxY - minY);
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
        global.selectedTool = tool;
        if(tool === "Eraser") {
            drawing.tempColor = drawing.nextColor;
            drawing.nextColor = "white";
            createShape = createPen;
            drawing.isEraser = true;
        }
        else if(tool === "Move") {
            //global.isMoving = true;
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
        drawing.redo.length = 0;
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

    $("#saveButton").click(function(event) {
            var stringifiedArray = JSON.stringify(drawing.shapes);
            var title = prompt("Input the name of your drawing");
            var username = "carl13"
            if(title != ""){
                var param = { 
                "user": username, // You should use your own username!
                "name": title,
                "content": stringifiedArray,
                "template": false
                };

                $.ajax({
                type: "POST",
                contentType: "application/json; charset=utf-8",
                url: "http://whiteboard.apphb.com/Home/Save",
                data: param,
                dataType: "jsonp",
                crossDomain: true,
                  success: function (data) {
                    var arr = [{ "ID": data.ID,
                        "drawingTitle": title
                    }];
                    $("#mSelection").tmpl(arr).appendTo("#load");
                },
                error: function (xhr, err) {
                    alert("error");
                }

                }); 
            }
        
    });

      $("#load").dblclick(function(event) {
           var item = this.options[this.selectedIndex].value;
            var param = { "id": item };
            $.ajax({
                type: "GET",
                contentType: "application/json; charset=utf-8",
                url: "http://whiteboard.apphb.com/Home/Getwhiteboard",
                data: param,
                dataType: "jsonp",
                crossDomain: true,
                success: function (data) {
                    var items = JSON.parse(data.WhiteboardContents);
                    drawing.shapes.length = 0;
                    for (var i = 0; i < items.length; i++){
                        var func = eval(items[i].type);
                        var ob = new func(items[i].x, items[i].y, items[i].color, items[i].thickness);
                        ob.endX = items[i].endX;
                        ob.endY = items[i].endY;
                        if(items[i].type === "Pen")
                        {
                            ob.clickX = items[i].clickX;
                            ob.clickY = items[i].clickY;   
                        }

                        drawing.shapes.push(ob);
                    }


                    render();
                },
                error: function (xhr, err) {
                    alert("error:\n" + xhr + "\n" + err);
                }
            });

        var param = {
            "user": "carl13",
            "template": true
        };

        $.ajax({
            type: "GET",
            contentType: "application/json; charset=utf-8",
            url: "http://whiteboard.apphb.com/Home/GetList",
            data: param,
            dataType: "jsonp",
            crossDomain: true,
            success: function (data) {
                $("#mSelection").tmpl(data).appendTo("#load");
            },
            error: function (xhr, err) {
                alert("error:\n" + xhr + "\n" + err);
            }
        });

    });
    
    $("#myCanvas").mousedown(function(e){

        var x = e.pageX - this.offsetLeft;
        var y = e.pageY - this.offsetTop;

        if(global.selectedTool === "Move") {
            global.isMoving = true;
        }
        if(global.isMoving) {
            for(var i = (drawing.shapes.length - 1); i >= 0; i-- ) {
                if(drawing.shapes[i].isInShape(x, y)) {
                    var obj = drawing.shapes[i];
                    if(obj.type === "Pen") {
                        global.startX = x;
                        global.startY = y;
                        obj.tempX = obj.clickX.slice();
                        obj.tempY = obj.clickY.slice();
                    }
                    else {
                        global.dragX = x - obj.x;
                        global.dragY = y - obj.y;
                        global.dragEndX = x - obj.endX;
                        global.dragEndY = y - obj.endY;
                    }
                    global.selectedObject = obj;
                    return;
                }
            }
            if(global.selectedObject) {
                global.selectedObject = null;
            }
            global.isMoving = false;
        }
        else {
            if(drawing.nextColor === "white" && !drawing.isEraser) {
                drawing.nextColor = drawing.tempColor;
            }

            global.isDrawing = true;

            var temp = createShape(x,y);
            if(temp !== undefined) {
                drawing.shapes.push(temp);
            }

            drawing.redo.length = 0;
        }
    });

    $("#myCanvas").mousemove(function(e){
        var x = e.pageX - this.offsetLeft;
        var y = e.pageY - this.offsetTop;

        if(global.isMoving && global.selectedObject.type === "Pen") {
            var l = global.selectedObject.clickX.length;
            for(var i = 0; i < l; i++) {
                global.selectedObject.clickX[i] = global.selectedObject.tempX[i] + x - global.startX;
                global.selectedObject.clickY[i] = global.selectedObject.tempY[i] + y - global.startY;
                render();
            }
        }

        else if(global.isMoving && global.selectedObject) {
            global.selectedObject.x = x - global.dragX;
            global.selectedObject.y = y - global.dragY;
            global.selectedObject.endX = x - global.dragEndX;
            global.selectedObject.endY = y - global.dragEndY;
            render();
        }

        else if(global.isDrawing) {
            drawing.shapes[drawing.shapes.length - 1].endX = x;
            drawing.shapes[drawing.shapes.length - 1].endY = y;
            if(global.selectedTool === "Pen" || global.selectedTool === "Eraser") {
                drawing.shapes[drawing.shapes.length - 1].addClick(x, y);
            }
            render();
            drawing.shapes[drawing.shapes.length - 1].draw(global);
        }
    });

    $("#myCanvas").mouseup(function(e){
        if(global.isMoving) {
            global.isMoving = false;
            global.selectedObject = null;
        }

        else {
            var x = e.pageX - this.offsetLeft;
            var y = e.pageY - this.offsetTop;
            drawing.shapes[drawing.shapes.length - 1].endX = x;
            drawing.shapes[drawing.shapes.length - 1].endY = y;

            global.isDrawing = false;
        }
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
            //console.log(drawing.shapes[i]);
        }
    }

    function Rectangle(x, y, width, height) {
        this.x = x,
        this.y = y,
        this.width = width,
        this.height = height
    }
});