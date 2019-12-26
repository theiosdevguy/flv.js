/**
 * @desc BitReader
 * @desc see: https://github.com/Jesseyx/bitstring.js
 */

function mask(n) {
    return (1 << n) - 1;
}

class BitReader {
    constructor(buffer) {
        this.buf = buffer.slice();
        this._pos = 1;
        this._peek = 0;
        this._peeklen = 0;
    }

    size() {
        return this.buf.length;
    }

    bitSize() {
        return this.buf.length * 8;
    }

    _nextByte() {
        let byte;
        if (this._pos === -1) {
            return null;
        }
        byte = this.buf[this._pos++];
        if (this._pos >= this.buf.length) {
            this._pos = -1;
        }
        return byte;
    }

    readBits(n = 0) {
        let size, bits, byte;
        if (n === 0) {
            return 0;
        }
        size = this._peeklen;
        bits = this._peek;
        while (size < n) {
            byte = this._nextByte();
            if (byte == null) {
                break;
            }
            size += 8;
            bits = bits << 8 | byte;
        }
        if (size > n) {
            this._peeklen = size - n;
            this._peek = bits & mask(this._peeklen);
            bits >>= this._peeklen;
        } else {
            this._peeklen = 0;
            this._peek = 0;
        }
        return size ? bits : null;
    }
}

export default BitReader;
