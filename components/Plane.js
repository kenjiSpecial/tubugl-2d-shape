const EventEmitter = require('wolfy87-eventemitter');

import {baseShaderFragSrc, baseShaderVertSrc} from './shaders/base.shader';
import {Program, ArrayBuffer, IndexArrayBuffer} from 'tubugl-core';

export class Box extends EventEmitter {
    constructor(gl, width, height, segmentW = 1, segmentH = 1, params = {}) {
        super();

        this._isGL2 = params.isGL2;
        this._gl = gl;

        this._side = params.side ? params.side : 'double'; // 'front', 'back', 'double'

        let fragmentShaderSrc = params.fragmentShaderSrc
            ? params.fragmentShaderSrc
            : baseShaderFragSrc;
        let vertexShaderSrc = params.vertexShaderSrc
            ? params.vertexShaderSrc
            : baseShaderVertSrc;

        this._program = new Program(
            this._gl,
            vertexShaderSrc,
            fragmentShaderSrc
        );
    }
    getVertice(width, height, segmentW, segmentH) {
        let xRate = 1 / segmentW;
        let yRate = 1 / segmentH;
        let xx, yy;

        let vertices = [];

        // set vertices
        for (yy = 0; yy <= segmentH; yy++) {
            let yPos = (-0.5 + yRate * yy) * height;
            for (xx = 0; xx <= segmentW; xx++) {
                let xPos = (-0.5 + xRate * xx) * width;
                vertices.push(xPos);
                vertices.push(yPos);
            }
        }

        vertices = new Float32Array(vertices);
        return vertices;
    }
    getIndices(segmentW, segmentH) {
        let indices = [];
        let xx, yy;

        for (yy = 0; yy < segmentH; yy++) {
            for (xx = 0; xx < segmentW; xx++) {
                let rowStartNum = yy * (segmentW + 1);
                let nextRowStartNum = (yy + 1) * (segmentW + 1);

                indices.push(rowStartNum + xx);
                indices.push(rowStartNum + xx + 1);
                indices.push(nextRowStartNum + xx);

                indices.push(rowStartNum + xx);
                indices.push(nextRowStartNum + xx);
                indices.push(nextRowStartNum + xx + 1);
            }
        }

        indices = new Uint16Array(indices);

        return indices;
    }
}
