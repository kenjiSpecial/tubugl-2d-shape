'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var glMatrix = require('gl-matrix/src/gl-matrix');
var tubuglCore = require('tubugl-core');
var tubuglUtils = require('tubugl-utils');
var vector3 = require('tubugl-math/src/vector3');
var euler = require('tubugl-math/src/euler');
var arrayBuffer = require('tubugl-core/src/arrayBuffer');
var program = require('tubugl-core/src/program');

var baseShaderVertSrc = "\nattribute vec4 position;\n\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat4 modelMatrix;\n\nvoid main() {\n    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;\n}";

var baseShaderFragSrc = "\nprecision mediump float;\n\nvoid main() {\n    float colorR = gl_FrontFacing ? 1.0 : 0.0;\n    float colorG = gl_FrontFacing ? 0.0 : 1.0;\n    \n    gl_FragColor = vec4(colorR, colorG, 0.0, 1.0);\n\n}";

var uvBaseShaderVertSrc = "\nattribute vec4 position;\nattribute vec2 uv;\n\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat4 modelMatrix;\n\nvarying vec2 vUv;\nvoid main(){\n    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;\n    vUv = uv;\n}\n";

var uvBaseShaderFragSrc = "\nprecision mediump float;\n\nvarying vec2 vUv;\nvoid main() {\n    float colorR = gl_FrontFacing ? 1.0 : 0.0;\n    \n    gl_FragColor = vec4(vUv, colorR, 1.0);\n\n}\n";

var textureBaseShaderFragSrc = "\nprecision mediump float;\n\nuniform sampler2D uTexture;\nuniform sampler2D uvTexture;\n\nvarying vec2 vUv;\n\nvoid main(){\n    if(gl_FrontFacing){\n        gl_FragColor = texture2D(uTexture, vUv);\n    }else{\n        gl_FragColor = texture2D(uvTexture, vUv);\n    }\n}\n";

var wireFrameFragSrc = "\nprecision mediump float;\n\nvoid main(){\n    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n}\n";

var base2ShaderVertSrc = "#version 300 es\nin vec4 position;\nin vec3 barycentricPosition;\n\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat4 modelMatrix;\n\nout vec3 vBarycentricPosition;\n\nvoid main() {\n    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;\n    \n    vBarycentricPosition = barycentricPosition; \n}\n";

var base2ShaderFragSrc = "#version 300 es\nprecision mediump float;\nin vec3 vBarycentricPosition;\n\nuniform bool uWireframe;\n\nout vec4 outColor;\n\nvoid main() {\n\n    if(uWireframe){\n        float minBarycentricVal = min(min(vBarycentricPosition.x, vBarycentricPosition.y), vBarycentricPosition.z);\n        if(minBarycentricVal > 0.01) discard;\n    }\n    \n    outColor = vec4(1.0, 0.0, 0.0, 1.0);\n}\n";

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var EventEmitter = require('wolfy87-eventemitter');
var Plane = function (_EventEmitter) {
	inherits(Plane, _EventEmitter);

	function Plane(gl) {
		var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
		var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 100;
		var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 100;
		var widthSegment = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
		var heightSegment = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
		classCallCheck(this, Plane);

		var _this = possibleConstructorReturn(this, (Plane.__proto__ || Object.getPrototypeOf(Plane)).call(this));

		_this.position = new vector3.Vector3();
		_this.rotation = new euler.Euler();
		_this.scale = new vector3.Vector3(1, 1, 1);

		_this._isGl2 = params.isGl2;
		_this._gl = gl;
		_this._side = params.side ? params.side : 'double'; // 'front', 'back', 'double'

		_this._width = width;
		_this._height = height;
		_this._widthSegment = widthSegment;
		_this._heightSegment = heightSegment;

		_this._modelMatrix = glMatrix.mat4.create();
		_this._isNeedUpdate = true;
		_this._isWire = !!params.isWire;
		_this._isDepthTest = params.isDepthTest == undefined ? true : !!params.isDepthTest;
		_this._isTransparent = !!params.isTransparent;
		_this.disableUpdateModelMatrix = !!params.disableUpdateModelMatrix;

		_this._makeProgram(params);
		_this._makeBuffer();

		if (_this._isWire) {
			_this._makeWireframe();
			_this._makeWireframeBuffer();
		}
		return _this;
	}

	createClass(Plane, [{
		key: 'updateModelMatrix',
		value: function updateModelMatrix(matrix) {
			this._modelMatrix = matrix;
		}
	}, {
		key: 'setPosition',
		value: function setPosition(x, y, z) {
			this._isNeedUpdate = true;

			if (x !== undefined) this.position.x = x;
			if (y !== undefined) this.position.y = y;
			if (z !== undefined) this.position.z = z;

			return this;
		}
	}, {
		key: 'setRotation',
		value: function setRotation(x, y, z) {
			this._isNeedUpdate = true;

			if (x !== undefined) this.rotation.x = x;
			if (y !== undefined) this.rotation.y = y;
			if (z !== undefined) this.rotation.z = z;

			return this;
		}
	}, {
		key: '_makeProgram',
		value: function _makeProgram(params) {
			var fragmentShaderSrc = params.fragmentShaderSrc ? params.fragmentShaderSrc : this._isGl2 ? base2ShaderFragSrc : baseShaderFragSrc;
			var vertexShaderSrc = params.vertexShaderSrc ? params.vertexShaderSrc : this._isGl2 ? base2ShaderVertSrc : baseShaderVertSrc;

			this._program = new tubuglCore.Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
		}
	}, {
		key: '_makeWireframe',
		value: function _makeWireframe() {
			this._wireframeProgram = new tubuglCore.Program(this._gl, baseShaderVertSrc, wireFrameFragSrc);
		}
	}, {
		key: '_makeBuffer',
		value: function _makeBuffer() {
			if (this._isGl2) {
				this._vao = new tubuglCore.VAO(this._gl);
				this._vao.bind();
			}
			this._positionBuffer = new tubuglCore.ArrayBuffer(this._gl, Plane.getVertices(this._width, this._height, this._widthSegment, this._heightSegment));
			this._positionBuffer.setAttribs('position', 2);

			if (this._vao) {
				this._positionBuffer.bind().attribPointer(this._program);
			}

			var indices = Plane.getIndices(this._widthSegment, this._heightSegment);
			this._indexBuffer = new tubuglCore.IndexArrayBuffer(this._gl, indices);

			this._cnt = indices.length;
		}
	}, {
		key: '_makeWireframeBuffer',
		value: function _makeWireframeBuffer() {
			this._wireframeIndexBuffer = new tubuglCore.IndexArrayBuffer(this._gl, tubuglUtils.generateWireframeIndices(this._indexBuffer.dataArray));
			this._wireframeIndexCnt = this._wireframeIndexBuffer.dataArray.length;
		}
	}, {
		key: '_updateAttributes',
		value: function _updateAttributes() {
			if (this._vao) {
				this._vao.bind();
			} else {
				this._positionBuffer.bind().attribPointer(this._program);
				this._indexBuffer.bind();
			}
		}
	}, {
		key: 'render',
		value: function render(camera) {
			this.update(camera).draw();
			if (this._isWire) this.updateWire(camera).drawWireframe();
		}
	}, {
		key: 'update',
		value: function update(camera) {
			if (!this.disableUpdateModelMatrix) this._updateModelMatrix();

			this._program.bind();

			this._updateAttributes();

			this._gl.uniformMatrix4fv(this._program.getUniforms('modelMatrix').location, false, this._modelMatrix);
			this._gl.uniformMatrix4fv(this._program.getUniforms('viewMatrix').location, false, camera.viewMatrix);
			this._gl.uniformMatrix4fv(this._program.getUniforms('projectionMatrix').location, false, camera.projectionMatrix);

			return this;
		}
	}, {
		key: 'updateWire',
		value: function updateWire(camera) {
			var prg = this._wireframeProgram;

			prg.bind();
			this._positionBuffer.bind().attribPointer(prg);
			this._wireframeIndexBuffer.bind();

			this._gl.uniformMatrix4fv(prg.getUniforms('modelMatrix').location, false, this._modelMatrix);
			this._gl.uniformMatrix4fv(prg.getUniforms('viewMatrix').location, false, camera.viewMatrix);
			this._gl.uniformMatrix4fv(prg.getUniforms('projectionMatrix').location, false, camera.projectionMatrix);

			return this;
		}
	}, {
		key: 'draw',
		value: function draw() {
			if (this._side === 'double') {
				this._gl.disable(this._gl.CULL_FACE);
			} else if (this._side === 'front') {
				this._gl.enable(this._gl.CULL_FACE);
				this._gl.cullFace(this._gl.BACK);
			} else {
				this._gl.enable(this._gl.CULL_FACE);
				this._gl.cullFace(this._gl.FRONT);
			}

			if (this._isDepthTest) this._gl.enable(this._gl.DEPTH_TEST);else this._gl.disable(this._gl.DEPTH_TEST);

			if (this._isTransparent) {
				this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
				this._gl.enable(this._gl.BLEND);
			} else {
				this._gl.blendFunc(this._gl.ONE, this._gl.ZERO);
				this._gl.disable(this._gl.BLEND);
			}

			this._gl.drawElements(this._gl.TRIANGLES, this._cnt, this._gl.UNSIGNED_SHORT, 0);

			return this;
		}
	}, {
		key: 'drawWireframe',
		value: function drawWireframe() {
			this._gl.drawElements(this._gl.LINES, this._wireframeIndexCnt, this._gl.UNSIGNED_SHORT, 0);

			return;
		}
	}, {
		key: 'resize',
		value: function resize() {}
	}, {
		key: 'addGui',
		value: function addGui(gui) {
			var _this2 = this;

			var positionFolder = gui.addFolder('position');
			positionFolder.add(this.position, 'x', -200, 200).listen();
			positionFolder.add(this.position, 'y', -200, 200).listen();
			positionFolder.add(this.position, 'z', -200, 200).listen();

			var scaleFolder = gui.addFolder('scale');
			scaleFolder.add(this.scale, 'x', 0.05, 2).step(0.01).listen();
			scaleFolder.add(this.scale, 'y', 0.05, 2).step(0.01).listen();
			scaleFolder.add(this.scale, 'z', 0.05, 2).step(0.01).listen();

			var rotationFolder = gui.addFolder('rotation');
			rotationFolder.add(this.rotation, 'x', -Math.PI, Math.PI).step(0.01).listen();
			rotationFolder.add(this.rotation, 'y', -Math.PI, Math.PI).step(0.01).listen();
			rotationFolder.add(this.rotation, 'z', -Math.PI, Math.PI).step(0.01).listen();

			gui.add(this, '_isWire').name('isWire').onChange(function () {
				if (_this2._isWire && !_this2._wireframeProgram) {
					_this2._makeWireframe();
					_this2._makeWireframeBuffer();
				}
			});
		}
		/**
   *
   * @param {Array}targetPosition
   */

	}, {
		key: 'lookAt',
		value: function lookAt(targetPosition) {
			glMatrix.mat4.lookAt(this.rotation.matrix, targetPosition, this.position.array, [0, 1, 0]);
			glMatrix.mat4.invert(this.rotation.matrix, this.rotation.matrix); // TODO: why I need invert matrix

			this.rotation.setFromRotationMatrix(this.rotation.matrix);

			return this;
		}
	}, {
		key: '_updateModelMatrix',
		value: function _updateModelMatrix() {
			// console.log(this._isNeedUpdate);
			if (!this._isNeedUpdate && !this.position.needsUpdate && !this.rotation.needsMatrixUpdate && !this.scale.needsUpdate) return;

			glMatrix.mat4.fromTranslation(this._modelMatrix, this.position.array);
			glMatrix.mat4.scale(this._modelMatrix, this._modelMatrix, this.scale.array);

			this.rotation.updateMatrix();
			glMatrix.mat4.multiply(this._modelMatrix, this._modelMatrix, this.rotation.matrix);

			this._isNeedUpdate = false;
			this.position.needsUpdate = false;
			this.scale.needsUpdate = false;

			return this;
		}
	}], [{
		key: 'getVertices',
		value: function getVertices(width, height, widthSegment, heightSegment) {
			var vertices = [];
			var xRate = 1 / widthSegment;
			var yRate = 1 / heightSegment;

			// set vertices and barycentric vertices
			for (var yy = 0; yy <= heightSegment; yy++) {
				var yPos = (-0.5 + yRate * yy) * height;

				for (var xx = 0; xx <= widthSegment; xx++) {
					var xPos = (-0.5 + xRate * xx) * width;
					vertices.push(xPos);
					vertices.push(yPos);
				}
			}
			vertices = new Float32Array(vertices);

			return vertices;
		}
	}, {
		key: 'getIndices',
		value: function getIndices(widthSegment, heightSegment) {
			var indices = [];

			for (var yy = 0; yy < heightSegment; yy++) {
				for (var xx = 0; xx < widthSegment; xx++) {
					var rowStartNum = yy * (widthSegment + 1);
					var nextRowStartNum = (yy + 1) * (widthSegment + 1);

					indices.push(rowStartNum + xx);
					indices.push(rowStartNum + xx + 1);
					indices.push(nextRowStartNum + xx);

					indices.push(rowStartNum + xx + 1);
					indices.push(nextRowStartNum + xx + 1);
					indices.push(nextRowStartNum + xx);
				}
			}

			indices = new Uint16Array(indices);

			return indices;
		}
	}]);
	return Plane;
}(EventEmitter);

var UvPlane = function (_Plane) {
	inherits(UvPlane, _Plane);

	function UvPlane(gl) {
		var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
		var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 100;
		var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 100;
		var segmentW = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
		var segmentH = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
		classCallCheck(this, UvPlane);
		return possibleConstructorReturn(this, (UvPlane.__proto__ || Object.getPrototypeOf(UvPlane)).call(this, gl, params, width, height, segmentW, segmentH));
	}

	createClass(UvPlane, [{
		key: '_makeProgram',
		value: function _makeProgram(params) {
			var vertexShaderSrc = params.vertexShaderSrc ? params.vertexShaderSrc : this._isGl2 ? base2ShaderVertSrc : uvBaseShaderVertSrc;

			var fragmentShaderSrc = params.fragmentShaderSrc ? params.fragmentShaderSrc : this._isGl2 ? base2ShaderFragSrc : uvBaseShaderFragSrc;

			console.log(vertexShaderSrc, fragmentShaderSrc);
			this._program = new program.Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
		}
	}, {
		key: '_updateAttributes',
		value: function _updateAttributes() {
			if (this._vao) {
				this._vao.bind();
			} else {
				this._positionBuffer.bind().attribPointer(this._program);
				this._uvBuffer.bind().attribPointer(this._program);
				this._indexBuffer.bind();
			}
		}
	}, {
		key: '_makeBuffer',
		value: function _makeBuffer() {
			get(UvPlane.prototype.__proto__ || Object.getPrototypeOf(UvPlane.prototype), '_makeBuffer', this).call(this);

			this._uvBuffer = new arrayBuffer.ArrayBuffer(this._gl, UvPlane.getUvs(this._widthSegment, this._heightSegment));
			this._uvBuffer.setAttribs('uv', 2);
		}
	}], [{
		key: 'getUvs',
		value: function getUvs(widthSegment, heightSegment) {
			var uvs = [];
			var xRate = 1 / widthSegment;
			var yRate = 1 / heightSegment;

			for (var yy = 0; yy <= heightSegment; yy++) {
				var uvY = 1.0 - yRate * yy;
				for (var xx = 0; xx <= widthSegment; xx++) {
					var uvX = xRate * xx;

					uvs.push(uvX);
					uvs.push(uvY);
				}
			}

			uvs = new Float32Array(uvs);

			return uvs;
		}
	}]);
	return UvPlane;
}(Plane);

var TexturePlane = function (_UvPlane) {
	inherits(TexturePlane, _UvPlane);

	function TexturePlane(gl) {
		var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
		var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 100;
		var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 100;
		var segmentW = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
		var segmentH = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
		classCallCheck(this, TexturePlane);

		var _this = possibleConstructorReturn(this, (TexturePlane.__proto__ || Object.getPrototypeOf(TexturePlane)).call(this, gl, params, width, height, segmentW, segmentH));

		_this._textures = params.textures;
		return _this;
	}

	createClass(TexturePlane, [{
		key: '_makeProgram',
		value: function _makeProgram() {
			var vertexShaderSrc = uvBaseShaderVertSrc;
			var fragmentShaderSrc = textureBaseShaderFragSrc;

			this._program = new program.Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
		}
	}, {
		key: '_updateAttributes',
		value: function _updateAttributes() {
			if (this._vao) {
				this._vao.bind();
			} else {
				this._positionBuffer.bind().attribPointer(this._program);
				this._uvBuffer.bind().attribPointer(this._program);
				this._indexBuffer.bind();
			}
		}
	}, {
		key: 'update',
		value: function update(camera) {
			var _this2 = this;

			get(TexturePlane.prototype.__proto__ || Object.getPrototypeOf(TexturePlane.prototype), 'update', this).call(this, camera);

			this._textures.forEach(function (textureData) {
				_this2._program.setUniformTexture(textureData.texture, textureData.name);
				textureData.texture.activeTexture().bind();
			});

			return this;
		}
	}]);
	return TexturePlane;
}(UvPlane);

exports.Plane = Plane;
exports.UvPlane = UvPlane;
exports.TexturePlane = TexturePlane;
