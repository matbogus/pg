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

        shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
        shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
        shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
        shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
    }

    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();

    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

        var normalMatrix = mat3.create();
        mat4.toInverseMat3(mvMatrix, normalMatrix);
        mat3.transpose(normalMatrix);
        gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
    }

    var teapotVertexPositionBuffer;
    var teapotVertexNormalBuffer;
    var teapotVertexTextureCoordBuffer;
    var teapotVertexIndexBuffer;

    function handleLoadedTeapot(teapotData) {
        teapotVertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexNormals), gl.STATIC_DRAW);
        teapotVertexNormalBuffer.itemSize = 3;
        teapotVertexNormalBuffer.numItems = teapotData.vertexNormals.length / 3;

        teapotVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexTextureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexTextureCoords), gl.STATIC_DRAW);
        teapotVertexTextureCoordBuffer.itemSize = 2;
        teapotVertexTextureCoordBuffer.numItems = teapotData.vertexTextureCoords.length / 2;

        teapotVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexPositions), gl.STATIC_DRAW);
        teapotVertexPositionBuffer.itemSize = 3;
        teapotVertexPositionBuffer.numItems = teapotData.vertexPositions.length / 3;

        teapotVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotVertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(teapotData.indices), gl.STATIC_DRAW);
        teapotVertexIndexBuffer.itemSize = 1;
        teapotVertexIndexBuffer.numItems = teapotData.indices.length;
    }

    function drawScene() {

        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (teapotVertexPositionBuffer == null || teapotVertexNormalBuffer == null || teapotVertexTextureCoordBuffer == null || teapotVertexIndexBuffer == null) {
            return;
        }

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, [0.0, 0.0, -60.0]);

        mat4.rotate(mvMatrix, degToRad(rTeapot), [0.5, 0.5, 0.5]);

        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, teapotVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, teapotVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, teapotVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.uniform3f(shaderProgram.ambientColorUniform, 0.8, 0.7, 0.7);

        var lightingDirection = [0.1, -1, 0];

        var adjustedLD = vec3.create();
        vec3.normalize(lightingDirection, adjustedLD);
        vec3.scale(adjustedLD, -1);

        gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);
        gl.uniform3f(shaderProgram.directionalColorUniform, 0.3, 0.8, 0.8);    

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, teapotVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function webGLStart() {
        var canvas = document.getElementById("6-canvas");
        
        initGL(canvas);
        initShaders();
        initTextures();
        loadTeapot();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

        setInterval(function () {
            refreshScene();
        }, 10);
    }

    var texture;

    function initTextures() {
        texture = gl.createTexture();
        texture.image = new Image();
        texture.image.onload = function () {
            handleLoadedTexture(texture)
        }
        texture.image.src = "metal.jpg";
    }

    function handleLoadedTexture(texture) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);
    }

    function loadTeapot() {
        var request = new XMLHttpRequest();
        request.open("GET", "teapot.js");
        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                handleLoadedTeapot(JSON.parse(request.responseText));
            }
        }
        request.send();
    }

    var rTeapot = 0;

    function refreshScene() {
        drawScene();
        rTeapot -= 75 / 100.0;
    }

    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }