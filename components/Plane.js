const EventEmitter = require('wolfy87-eventemitter');


export class Box extends EventEmitter{
    constructor(gl, width, height, segmentW = 1, segmentH = 1, params = {}){
        super();

        this._isGL2 = params.isGL2;
        this._gl = gl;

        this._side = params.side ? params.side : 'double'; // 'front', 'back', 'double'

        this._fragmentShaderSrc = params.fragmentShaderSrc ? params.fragmentShaderSrc : ;


    }
}

