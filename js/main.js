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
        selectedTool: "Pen",
        currentInputBox: null,
        textX: 0,
        textY: 0
    };

    var drawing = {
        shapes: [],
        redo: [],
        nextColor: "black",
        tempColor: "black",
        nextWidth: 2,
        text: "Hello World",
        font: "Arial",
        fontSize: "16pt"
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
            return !!(x >= bounds.x && x <= bounds.x + bounds.width
            && y >= bounds.y && y <= bounds.y + bounds.height);
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
        constructor: function(x, y, color, thick, text, font, fontSize) {
            this.base(x, y, color, "Text", thick);
            this.text = text;
            this.font = font;
            this.size = fontSize;
        },

        draw: function(global) {
            global.context.font = this.size + " " + this.font;
            global.context.fillStyle = this.color;
            global.context.fillText(this.text, this.x, this.y);
        },

        calcBounds: function() {

            var textWidth = document.getElementById("textWidth");
            textWidth.innerHTML = this.text;
            textWidth.style.fontSize = this.size;
            var height = (textWidth.clientHeight + 1);
            var width = (textWidth.clientWidth + 1);
            var x = this.x;
            var y = this.y - height / 1.7;
            return new Rectangle(x, y, width, height);
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
            //Do nothing
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
        var temp = drawing.redo.pop();
        if(temp !== undefined) {
            drawing.shapes.push(temp);
        }
        render();
    });

    $("#fontPicker").click(function(event) {
        drawing.font = $(this).val();
    });

    $("#fontSize").click(function(event) {
        drawing.fontSize = $(this).val() + "pt";
    });

    $("#saveButton").click(function(event) {
            var stringifiedArray = JSON.stringify(drawing.shapes);
            var title = prompt("Input the name of your drawing");
            var username = "carl13";
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
                        var obj;
                        if(items[i].type === "Text") {
                            obj = new func(items[i].x, items[i].y, items[i].color, items[i].thickness,
                                items[i].text, items[i].font, items[i].size);
                        }

                        else {
                            obj = new func(items[i].x, items[i].y, items[i].color, items[i].thickness);
                            obj.endX = items[i].endX;
                            obj.endY = items[i].endY;
                            if(items[i].type === "Pen") {
                                obj.clickX = items[i].clickX;
                                obj.clickY = items[i].clickY;
                            }
                        }
                        drawing.shapes.push(obj);
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

    $("#saveButtonTemp").click(function(event) {
            var stringifiedArray = JSON.stringify(drawing.shapes);
            var title = prompt("Input the name of your Template");
            var username = "carl13";
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
                            "tempTitle": title
                        }];
                        $("#mSelectiontemp").tmpl(arr).appendTo("#loadtemp");
                    },
                    error: function (xhr, err) {
                        alert("error");
                    }

                }); 
            }
        
    });

      $("#loadtemp").dblclick(function(event) {
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
                    var rand = Math.floor(Math.random() * 30);
                    for (var i = 0; i < items.length; i++){
                        var func = eval(items[i].type);
                        var obj;

                        if(items[i].type === "Text") {
                            obj = new func(items[i].x, items[i].y, items[i].color, items[i].thickness,
                                items[i].text, items[i].font, items[i].size);
                        }

                        else {
                            obj = new func(items[i].x + rand, items[i].y + rand, items[i].color, items[i].thickness);
                            obj.endX = items[i].endX + rand;
                            obj.endY = items[i].endY + rand;
                            if (items[i].type === "Pen") {
                                obj.clickX = items[i].clickX;
                                obj.clickY = items[i].clickY;
                                for (var i = 0; i < obj.clickX.length; i++) {
                                    obj.clickX[i] += rand;
                                    obj.clickY[i] += rand;
                                }
                            }
                        }
                        drawing.shapes.push(obj);
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
                $("#mSelectiontemp").tmpl(data).appendTo("#loadtemp");
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
        else if (global.selectedTool !== "Text") {
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

        else if (global.selectedTool !== "Text") {
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
        return new Text(x, y, drawing.nextColor, drawing.nextWidth, drawing.text, drawing.font, drawing.fontSize);
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
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    $("#myCanvas").on("click", function(event) {
        if(global.selectedTool === "Text") {
            if(global.currentInputBox) {
                global.currentInputBox.remove();
            }

            global.textX = event.pageX - this.offsetLeft;
            global.textY = event.pageY - this.offsetTop;

            global.currentInputBox = $("<input/>");
            global.currentInputBox.css("position", "absolute");
            global.currentInputBox.css("top", event.pageY);
            global.currentInputBox.css("left", event.pageX);

            $(".text-spawner").append(global.currentInputBox);

            global.currentInputBox.focus();
        }

    });

    $(document).keypress(function(event) {
        if(event.which === 13) {
            if(global.currentInputBox) {
                drawing.text = global.currentInputBox.val();
                //var textWidth = document.getElementById('textWidth');
                //textWidth.innerHTML = global.currentInputBox.val();
                var temp = createText(global.textX, global.textY);
                if(temp !== undefined) {
                    drawing.shapes.push(temp);
                }
                render();
                global.currentInputBox.remove();
            }
        }
    });
});