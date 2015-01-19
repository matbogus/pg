var gl;

    function initGL(canvas) {
        try {
            gl = canvas.getContext("webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {}

        if (!gl) {
            console.error("Cannot load gl instance.")
        }
    }

    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        
        if (!shaderScript) {
            return null;
        }

        var shader;

        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, shaderScript.innerHTML);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Cannot compile shader.");
            return null;
        }

        return shader;
    }

    var shaderProgram;

    function initShaders() {
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);
        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
        gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    }

    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();

    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    }

    var pyramidVertexColorBuffer;

    var pyramidVertexPositionBuffer;

    var mvMatrixStack = [];

    function initBuffers() {
        pyramidVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
        var vertices = [
            // Front face
             0.0,  1.0,  0.0,
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
            // Right face
             0.0,  1.0,  0.0,
             1.0, -1.0,  1.0,
             1.0, -1.0, -1.0,
            // Back face
             0.0,  1.0,  0.0,
             1.0, -1.0, -1.0,
            -1.0, -1.0, -1.0,
            // Left face
             0.0,  1.0,  0.0,
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        pyramidVertexPositionBuffer.itemSize = 3;
        pyramidVertexPositionBuffer.numItems = 12;

        // color buffers

        triangleVertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
        var colors = [
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        triangleVertexColorBuffer.itemSize = 4;
        triangleVertexColorBuffer.numItems = 3;

        pyramidVertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
        var colors = [
            // Front face
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            // Right face
            0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            // Back face
            0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            // Left face
            1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        pyramidVertexColorBuffer.itemSize = 4;
        pyramidVertexColorBuffer.numItems = 12;
    }

    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
        mat4.identity(mvMatrix);

        mat4.rotate(mvMatrix, degToRad(-pitch), [1, 0, 0]);
        mat4.rotate(mvMatrix, degToRad(-yaw), [0, 1, 0]);
        mat4.translate(mvMatrix, [-xPos, -yPos, -zPos]);

        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pyramidVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, pyramidVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
        setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, pyramidVertexPositionBuffer.numItems);
    }

    function webGLStart() {
        var canvas = document.getElementById("2-canvas");
        initGL(canvas);
        initShaders();
        initBuffers();
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

        document.onkeydown = handleKeyDown;
        document.onkeyup = handleKeyUp;

        setInterval(function () {
            refreshScene();
        }, 10);
    }

    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    var currentlyPressedKeys = {};

    function handleKeyDown(event) {
        currentlyPressedKeys[event.keyCode] = true;
    }
    function handleKeyUp(event) {
        currentlyPressedKeys[event.keyCode] = false;
    }

    var pitch = 0;
    var pitchRate = 0;

    var yaw = 0;
    var yawRate = 0;

    var xPos = 0;
    var yPos = 0.4;
    var zPos = 0;

    var speed = 0;

    function handleKeys() {
        if (currentlyPressedKeys[38]) {
          pitchRate = 0.3;
        } else if (currentlyPressedKeys[40] ) {
          pitchRate = -0.3;
        } else {
          pitchRate = 0;
        }
        
        if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
          yawRate = 0.3;
        } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
          yawRate = -0.3;
        } else {
          yawRate = 0;
        }

        if (currentlyPressedKeys[87]) {
          speed = 0.07;
        } else if (currentlyPressedKeys[83]) {
          speed = -0.07;
        } else {
          speed = 0;
        }
    }

    function refreshScene () {
        handleKeys();
        drawScene();
        if (speed != 0) {
            xPos -= Math.sin(degToRad(yaw)) * speed;
            zPos -= Math.cos(degToRad(yaw)) * speed;
        }

        yaw += yawRate;
        pitch += pitchRate;
    }