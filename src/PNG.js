// adapted from https://github.com/devongovett/png.js/
// and from https://github.com/lukeapage/pngjs

function readBytes(numbytes, buf, pos)
{
    var i, bytes = [];
    if (0 <= numbytes) for (i=0; i<numbytes; ++i)  bytes.push(buf[pos.pos++]);
    else for (i=0; i>numbytes; --i) bytes.push(buf[pos.pos++]);
    return bytes;
}
function readUInt8(buf, pos)
{
    return buf[pos.pos++];
}
function readUInt16LE(buf, pos)
{
    // big endian, the most significant byte is stored in the smallest address
    // little endian, the least significant byte is stored in the smallest address
    var b0, b1;
    b0 = buf[pos.pos++]; b1 = buf[pos.pos++];
    return b0 | (b1<<8);
};
function readUInt16BE(buf, pos)
{
    // big endian, the most significant byte is stored in the smallest address
    // little endian, the least significant byte is stored in the smallest address
    var b0, b1;
    b0 = buf[pos.pos++]; b1 = buf[pos.pos++];
    return b1 | (b0<<8);
}
function readUInt32LE(buf, pos)
{
    // big endian, the most significant byte is stored in the smallest address
    // little endian, the least significant byte is stored in the smallest address
    var b0, b1, b2, b3;
    b0 = buf[pos.pos++]; b1 = buf[pos.pos++]; b2 = buf[pos.pos++]; b3 = buf[pos.pos++];
    return b0 | (b1<<8) | (b2<<16) | (b3<<24);
}
function readUInt32BE(buf, pos)
{
    // big endian, the most significant byte is stored in the smallest address
    // little endian, the least significant byte is stored in the smallest address
    var b0, b1, b2, b3;
    b0 = buf[pos.pos++]; b1 = buf[pos.pos++]; b2 = buf[pos.pos++]; b3 = buf[pos.pos++];
    return b3 | (b2<<8) | (b1<<16) | (b0<<24);
}

var
APNG_DISPOSE_OP_NONE = 0,
APNG_DISPOSE_OP_BACKGROUND = 1,
APNG_DISPOSE_OP_PREVIOUS = 2,
APNG_BLEND_OP_SOURCE = 0,
APNG_BLEND_OP_OVER = 1,
readUInt16 = readUInt16BE,
readUInt32 = readUInt32BE;

function PNG() {}
PNG[PROTO] = {
    constructor: PNG,

    data: null,
    pos: null,
    palette: null,
    imgData: null,
    transparency: null,
    animation: null,
    text: null,
    width: 0,
    height: 0,
    bits: null,
    colorType: null,
    compressionMethod: null,
    filterMethod: null,
    interlaceMethod: null,
    hasAlphaChannel: null,
    colors: null,
    colorSpace: null,
    pixelBitlength: null,

    readData: function(data) {
        var self = this;
        var chunkSize, colors, delayDen, delayNum, frame, i, index, key, section, short, text, _i, _j, _ref;

        self.data = data;
        self.pos = 8;
        self.palette = [];
        self.imgData = [];
        self.transparency = {};
        self.animation = null;
        self.text = {};
        frame = null;
        while (true)
        {
            chunkSize = readUInt32(self.data, self);
            section = ((function() {
                var _i, _results;
                _results = [];
                for (i = _i = 0; _i < 4; i = ++_i) {
                _results.push(String.fromCharCode(this.data[this.pos++]));
                }
                return _results;
            }).call(self)).join('');

            switch (section)
            {
                case 'IHDR':
                    self.width = readUInt32(self.data, self);
                    self.height = readUInt32(self.data, self);
                    self.bits = self.data[self.pos++];
                    self.colorType = self.data[self.pos++];
                    self.compressionMethod = self.data[self.pos++];
                    self.filterMethod = self.data[self.pos++];
                    self.interlaceMethod = self.data[self.pos++];
                    break;
                case 'acTL':
                    self.animation = {
                        numFrames: readUInt32(self.data, self),
                        numPlays: readUInt32(self.data, self) || INF,
                        frames: []
                    };
                    break;
                case 'PLTE':
                    self.palette = readBytes(chunkSize, self.data, self);
                    break;
                case 'fcTL':
                    if (frame)
                    {
                        self.animation.frames.push(frame);
                    }
                    self.pos += 4;
                    frame = {
                        width: readUInt32(self.data, self),
                        height: readUInt32(self.data, self),
                        xOffset: readUInt32(self.data, self),
                        yOffset: readUInt32(self.data, self)
                    };
                    delayNum = readUInt16(self.data, self);
                    delayDen = readUInt16(self.data, self) || 100;
                    frame.delay = 1000 * delayNum / delayDen;
                    frame.disposeOp = self.data[self.pos++];
                    frame.blendOp = self.data[self.pos++];
                    frame.data = [];
                    break;
                case 'IDAT':
                case 'fdAT':
                    if (section === 'fdAT')
                    {
                        self.pos += 4;
                        chunkSize -= 4;
                    }
                    data = (frame != null ? frame.data : void 0) || self.imgData;
                    for (i = _i = 0; 0 <= chunkSize ? _i < chunkSize : _i > chunkSize; i = 0 <= chunkSize ? ++_i : --_i)
                    {
                        data.push(self.data[self.pos++]);
                    }
                    break;
                case 'tRNS':
                    self.transparency = {};
                    switch (self.colorType)
                    {
                        case 3:
                            self.transparency.indexed = readBytes(chunkSize, self.data, self);
                            short = 255 - self.transparency.indexed.length;
                            if (short > 0)
                            {
                                for (i = _j = 0; 0 <= short ? _j < short : _j > short; i = 0 <= short ? ++_j : --_j)
                                {
                                    self.transparency.indexed.push(255);
                                }
                            }
                            break;
                        case 0:
                            self.transparency.grayscale = readBytes(chunkSize, self.data, self)[0];
                            break;
                        case 2:
                            self.transparency.rgb = readBytes(chunkSize, self.data, self);
                    }
                    break;
                case 'tEXt':
                    text = readBytes(chunkSize, self.data, self);
                    index = text.indexOf(0);
                    key = String.fromCharCode.apply(String, text.slice(0, index));
                    self.text[key] = String.fromCharCode.apply(String, text.slice(index + 1));
                    break;
                case 'IEND':
                    if (frame)
                    {
                        self.animation.frames.push(frame);
                    }
                    self.colors = (function() {
                        switch (this.colorType)
                        {
                            case 0:
                            case 3:
                            case 4:
                                return 1;
                            case 2:
                            case 6:
                                return 3;
                        }
                    }).call(self);
                    self.hasAlphaChannel = (_ref = self.colorType) === 4 || _ref === 6;
                    colors = self.colors + (self.hasAlphaChannel ? 1 : 0);
                    self.pixelBitlength = self.bits * colors;
                    self.colorSpace = (function() {
                        switch (this.colors)
                        {
                            case 1:
                                return 'DeviceGray';
                            case 3:
                                return 'DeviceRGB';
                        }
                    }).call(self);
                    self.imgData = new Uint8Array(self.imgData);
                    return;
                default:
                    self.pos += chunkSize;
            }
            self.pos += 4;
            if (self.pos > self.data.length)
            {
                throw new Error("Incomplete or corrupt PNG file");
            }
        }
    },

    decodePixels: async function(data) {
        var self = this, byte, c, col, i, left, length,
            p, pa, paeth, pb, pc, pixelBytes, pixels, pos, row,
            scanlineLength, upper, upperLeft, _i, _j, _k, _l, _m;
        if (data == null)
        {
            data = self.imgData;
        }
        if (data.length === 0)
        {
            return new Uint8Array(0);
        }
        data = await inflate(data);
        pixelBytes = self.pixelBitlength / 8;
        scanlineLength = pixelBytes * self.width;
        pixels = new Uint8Array(scanlineLength * self.height);
        length = data.length;
        row = 0;
        pos = 0;
        c = 0;
        while (pos < length)
        {
            switch (data[pos++])
            {
                case 0:
                    for (i = _i = 0; _i < scanlineLength; i = _i += 1)
                    {
                        pixels[c++] = data[pos++];
                    }
                    break;
                case 1:
                    for (i = _j = 0; _j < scanlineLength; i = _j += 1)
                    {
                        byte = data[pos++];
                        left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
                        pixels[c++] = (byte + left) % 256;
                    }
                    break;
                case 2:
                    for (i = _k = 0; _k < scanlineLength; i = _k += 1)
                    {
                        byte = data[pos++];
                        col = (i - (i % pixelBytes)) / pixelBytes;
                        upper = row && pixels[(row - 1) * scanlineLength + col * pixelBytes + (i % pixelBytes)];
                        pixels[c++] = (upper + byte) % 256;
                    }
                    break;
                case 3:
                    for (i = _l = 0; _l < scanlineLength; i = _l += 1)
                    {
                        byte = data[pos++];
                        col = (i - (i % pixelBytes)) / pixelBytes;
                        left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
                        upper = row && pixels[(row - 1) * scanlineLength + col * pixelBytes + (i % pixelBytes)];
                        pixels[c++] = (byte + Math.floor((left + upper) / 2)) % 256;
                    }
                    break;
                case 4:
                    for (i = _m = 0; _m < scanlineLength; i = _m += 1)
                    {
                        byte = data[pos++];
                        col = (i - (i % pixelBytes)) / pixelBytes;
                        left = i < pixelBytes ? 0 : pixels[c - pixelBytes];
                        if (row === 0)
                        {
                            upper = upperLeft = 0;
                        }
                        else
                        {
                            upper = pixels[(row - 1) * scanlineLength + col * pixelBytes + (i % pixelBytes)];
                            upperLeft = col && pixels[(row - 1) * scanlineLength + (col - 1) * pixelBytes + (i % pixelBytes)];
                        }
                        p = left + upper - upperLeft;
                        pa = Math.abs(p - left);
                        pb = Math.abs(p - upper);
                        pc = Math.abs(p - upperLeft);
                        if (pa <= pb && pa <= pc)
                        {
                            paeth = left;
                        }
                        else if (pb <= pc)
                        {
                            paeth = upper;
                        }
                        else
                        {
                            paeth = upperLeft;
                        }
                        pixels[c++] = (byte + paeth) % 256;
                    }
                    break;
                default:
                    throw new Error("Invalid filter algorithm: " + data[pos - 1]);
            }
            row++;
        }
        return pixels;
    },

    decodePalette: function() {
        var self = this, c, i, length, palette, pos, ret,
            transparency, _i, _ref, _ref1;
        palette = self.palette;
        transparency = self.transparency.indexed || [];
        ret = new Uint8Array((transparency.length || 0) + palette.length);
        pos = 0;
        length = palette.length;
        c = 0;
        for (i = _i = 0, _ref = palette.length; _i < _ref; i = _i += 3)
        {
            ret[pos++] = palette[i];
            ret[pos++] = palette[i + 1];
            ret[pos++] = palette[i + 2];
            ret[pos++] = (_ref1 = transparency[c++]) != null ? _ref1 : 255;
        }
        return ret;
    },

    copyToImageData: function(imageData, pixels) {
        var self = this, alpha, colors, data, i, input,
            j, k, length, palette, v, _ref;
        colors = self.colors;
        palette = null;
        alpha = self.hasAlphaChannel;
        if (self.palette.length)
        {
            palette = (_ref = self._decodedPalette) != null ? _ref : self._decodedPalette = self.decodePalette();
            colors = 4;
            alpha = true;
        }
        data = imageData.data || imageData;
        length = data.length;
        input = palette || pixels;
        i = j = 0;
        if (colors === 1)
        {
            while (i < length)
            {
                k = palette ? pixels[i / 4] * 4 : j;
                v = input[k++];
                data[i++] = v;
                data[i++] = v;
                data[i++] = v;
                data[i++] = alpha ? input[k++] : 255;
                j = k;
            }
        }
        else
        {
            while (i < length)
            {
                k = palette ? pixels[i / 4] * 4 : j;
                data[i++] = input[k++];
                data[i++] = input[k++];
                data[i++] = input[k++];
                data[i++] = alpha ? input[k++] : 255;
                j = k;
            }
        }
    },

    decode: async function() {
        var self = this, ret;
        ret = new Uint8Array((self.width * self.height) << 2);
        self.copyToImageData(ret, await self.decodePixels());
        return ret;
    }
};

// PNG utilities
var PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],

    TYPE_IHDR = 0x49484452,
    TYPE_gAMA = 0x67414d41,
    TYPE_tRNS = 0x74524e53,
    TYPE_PLTE = 0x504c5445,
    TYPE_IDAT = 0x49444154,
    TYPE_IEND = 0x49454e44,

    // color-type bits
    COLORTYPE_GRAYSCALE = 0,
    COLORTYPE_PALETTE = 1,
    COLORTYPE_COLOR = 2,
    COLORTYPE_ALPHA = 4, // e.g. grayscale and alpha

    // color-type combinations
    COLORTYPE_PALETTE_COLOR = 3,
    COLORTYPE_COLOR_ALPHA = 6,

    COLORTYPE_TO_BPP_MAP = {
        0: 1,
        2: 3,
        3: 1,
        4: 2,
        6: 4
    },

    GAMMA_DIVISION = 100000
;

function clampByte(value)
{
    return stdMath.max(0, stdMath.min(255, stdMath.round(value)));
}
function paethPredictor(left, above, upLeft)
{
    var paeth = left + above - upLeft,
        pLeft = stdMath.abs(paeth - left),
        pAbove = stdMath.abs(paeth - above),
        pUpLeft = stdMath.abs(paeth - upLeft)
    ;

    if (pLeft <= pAbove && pLeft <= pUpLeft) return left;
    if (pAbove <= pUpLeft) return above;
    return upLeft;
}
function filterNone(pxData, pxPos, byteWidth, rawData, rawPos)
{
    pxData.copy(rawData, rawPos, pxPos, pxPos + byteWidth);
}
function filterSumNone(pxData, pxPos, byteWidth)
{
    var sum = 0, i, length = pxPos + byteWidth;
    for (i = pxPos; i < length; i++)
    {
        sum += stdMath.abs(pxData[i]);
    }
    return sum;
}
function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp)
{
    for (var x = 0; x < byteWidth; x++)
    {
        var left = x >= bpp ? pxData[pxPos + x - bpp] : 0,
            val = pxData[pxPos + x] - left
        ;
        rawData[rawPos + x] = ubyte(val);
    }
}
function filterSumSub(pxData, pxPos, byteWidth, bpp)
{
    var sum = 0, x;
    for (x = 0; x < byteWidth; x++)
    {
        var left = x >= bpp ? pxData[pxPos + x - bpp] : 0,
            val = pxData[pxPos + x] - left
        ;
        sum += stdMath.abs(val);
    }
    return sum;
}
function filterUp(pxData, pxPos, byteWidth, rawData, rawPos)
{
    for (var x = 0; x < byteWidth; x++)
    {
        var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0,
            val = pxData[pxPos + x] - up
        ;
        rawData[rawPos + x] = ubyte(val);
    }
}
function filterSumUp(pxData, pxPos, byteWidth)
{
    var sum = 0, x, length = pxPos + byteWidth;
    for (x = pxPos; x < length; x++)
    {
        var up = pxPos > 0 ? pxData[x - byteWidth] : 0,
            val = pxData[x] - up
        ;
        sum += stdMath.abs(val);
    }
    return sum;
}
function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp)
{
    for (var x = 0; x < byteWidth; x++)
    {
        var left = x >= bpp ? pxData[pxPos + x - bpp] : 0,
            up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0,
            val = pxData[pxPos + x] - ((left + up) >> 1)
        ;
        rawData[rawPos + x] = ubyte(val);
    }
}
function filterSumAvg(pxData, pxPos, byteWidth, bpp)
{
    var sum = 0, x;
    for (x = 0; x < byteWidth; x++)
    {
        var left = x >= bpp ? pxData[pxPos + x - bpp] : 0,
            up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0,
            val = pxData[pxPos + x] - ((left + up) >> 1)
        ;
        sum += stdMath.abs(val);
    }
    return sum;
}
function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp)
{
    for (var x = 0; x < byteWidth; x++)
    {
        var left = x >= bpp ? pxData[pxPos + x - bpp] : 0,
            up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0,
            upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0,
            val = pxData[pxPos + x] - paethPredictor(left, up, upleft)
        ;
        rawData[rawPos + x] = ubyte(val);
    }
}
function filterSumPaeth(pxData, pxPos, byteWidth, bpp)
{
    var sum = 0, x;
    for (x = 0; x < byteWidth; x++)
    {
        var left = x >= bpp ? pxData[pxPos + x - bpp] : 0,
            up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0,
            upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0,
            val = pxData[pxPos + x] - paethPredictor(left, up, upleft)
        ;
        sum += stdMath.abs(val);
    }
    return sum;
}

async function deflate(data, compressionLevel, chunkSize)
{
    var opts = {
        chunkSize: null == chunkSize ? 16*1024 : chunkSize,
    };
    if (null != compressionLevel) opts.level = compressionLevel;
    return await (new Promise(function(resolve) {
        require('zlib').deflate(data instanceof Buffer ? data : Buffer.from(data), opts, function(err, zdata) {
            resolve(err ? null : zdata);
        });
    }));
}
async function inflate(data, chunkSize)
{
    var opts = {
        chunkSize: null == chunkSize ? 16*1024 : chunkSize,
    };
    return await (new Promise(function(resolve) {
        require('zlib').inflate(data instanceof Buffer ? data : Buffer.from(data), opts, function(err, zdata) {
            resolve(err ? null : zdata);
        });
    }));
}

var crcTable = null;
function getCRCTable()
{
    if (null == crcTable)
    {
        crcTable = new Int32Array(256);
        var i, j, currentCrc;
        for (i=0; i<256; ++i)
        {
            currentCrc = i;
            for (j=0; j<8; ++j)
            {
                currentCrc = currentCrc & 1 ? (0xedb88320 ^ (currentCrc >>> 1)) : (currentCrc >>> 1);
            }
            crcTable[i] = currentCrc;
        }
    }
    return crcTable;
}
function crc32(buffer)
{
    var crcTable = getCRCTable(), crc = -1, i, l;
    for (i=0,l=buffer.length; i<l; ++i)
    {
        crc = crcTable[(crc ^ buffer[i]) & 255] ^ (crc >>> 8);
    }
    return crc ^ (-1);
}
function ubyte(value)
{
    return value & 255;
}
function I1(value, buffer = null, pos = 0)
{
    if (null == buffer) buffer = Buffer.alloc(1);
    if (null == pos) pos = 0;
    buffer[pos] = value & 255;
    return buffer;
}
function I4(value, buffer = null, pos = 0)
{
    if (null == buffer) buffer = Buffer.alloc(4);
    if (null == pos) pos = 0;
    buffer.writeUInt32BE(value & 0xffffffff, pos);
    return buffer;
}
function i4(value, buffer = null, pos = 0)
{
    if (null == buffer) buffer = Buffer.alloc(4);
    if (null == pos) pos = 0;
    buffer.writeInt32BE(value, pos);
    return buffer;
}

function PNGPacker(options)
{
    options = options || {};

    options.deflateChunkSize = stdMath.max(1024, parseInt(options.deflateChunkSize || 32 * 1024));
    options.deflateLevel = stdMath.min(9, stdMath.max(0, parseInt(options.deflateLevel != null ? options.deflateLevel : 9)));
    options.deflateStrategy = stdMath.min(3, stdMath.max(0, parseInt(options.deflateStrategy != null ? options.deflateStrategy : 3)));
    options.inputHasAlpha = !!(options.inputHasAlpha != null ? options.inputHasAlpha : true);
    options.bitDepth = 8//options.bitDepth || 8;
    options.colorType = stdMath.min(6, stdMath.max(0, parseInt(('number' === typeof options.colorType) ? options.colorType : COLORTYPE_COLOR_ALPHA)));

    if (options.colorType !== COLORTYPE_COLOR && options.colorType !== COLORTYPE_COLOR_ALPHA)
    {
        throw new Error('option color type:' + options.colorType + ' is not supported at present');
    }
    /*if (options.bitDepth !== 8)
    {
        throw new Error('option bit depth:' + options.bitDepth + ' is not supported at present');
    }*/
    this._options = options;
}
PNGPacker[PROTO] = {
    _options: null,

    constructor: PNGPacker,

    toPNG: async function(data, width, height) {
        var png = [], filteredData, compressedData, deflateOpts;

        // Signature
        png.push(Buffer.from(PNG_SIGNATURE));

        // Header
        png.push(this.packIHDR(width, height));

        // gAMA
        if (this._options.gamma) png.push(this.packGAMA(this._options.gamma));

        // filter data
        filteredData = this.filterData(Buffer.from(data), width, height);

        // compress data
        deflateOpts = this.getDeflateOptions();
        compressedData = await deflate(filteredData, deflateOpts.level, deflateOpts.chuckSize);
        filteredData = null;

        if (!compressedData || !compressedData.length)
            throw new Error('bad png - invalid compressed data response');

        // Data
        png.push(this.packIDAT(Buffer.from(compressedData)));
        compressedData = null;

        // End
        png.push(this.packIEND());

        return Buffer.concat(png);
    },

    getDeflateOptions: function() {
        return {
            chunkSize: this._options.deflateChunkSize,
            level: this._options.deflateLevel,
            strategy: this._options.deflateStrategy
        };
    },

    filterData: function(data, width, height) {
        // convert to correct format for filtering (e.g. right bpp and bit depth)
        // and filter pixel data
        return this._filter(this._bitPack(data, width, height), width, height);
    },

    packIHDR: function(width, height) {
        var buffer = Buffer.alloc(13);
        I4(width, buffer, 0);
        I4(height, buffer, 4);
        I1(this._options.bitDepth, buffer, 8);  // bit depth
        I1(this._options.colorType, buffer, 9); // colorType
        I1(0, buffer, 10); // compression
        I1(0, buffer, 11); // filter
        I1(0, buffer, 12); // interlace
        return this._packChunk(TYPE_IHDR, buffer);
    },

    packGAMA: function(gamma) {
        return this._packChunk(TYPE_gAMA, I4(stdMath.floor(parseFloat(gamma) * GAMMA_DIVISION)));
    },

    packIDAT: function(data) {
        return this._packChunk(TYPE_IDAT, data);
    },

    packIEND: function() {
        return this._packChunk(TYPE_IEND, null);
    },

    _bitPack: function(data, width, height) {
        var inputHasAlpha = this._options.inputHasAlpha,
            outHasAlpha = this._options.colorType === COLORTYPE_COLOR_ALPHA;
        if (inputHasAlpha && outHasAlpha)
        {
            return data;
        }
        if (!inputHasAlpha && !outHasAlpha)
        {
            return data;
        }

        var outBpp = outHasAlpha ? 4 : 3,
            outData = Buffer.alloc(width * height * outBpp),
            inBpp = inputHasAlpha ? 4 : 3,
            inIndex = 0,
            outIndex = 0,
            bgColor = this._options.bgColor || {},
            x, y, red, green, blue, alpha,
            bgRed, bgGreen, bgBlue
        ;

        bgRed = clampByte(bgColor.red != null ? bgColor.red : 255);
        bgGreen = clampByte(bgColor.green != null ? bgColor.green : 255);
        bgBlue = clampByte(bgColor.blue != null ? bgColor.blue : 255);

        for (y = 0; y < height; y++)
        {
            for (x = 0; x < width; x++)
            {
                red = data[inIndex];
                green = data[inIndex + 1];
                blue = data[inIndex + 2];

                if (inputHasAlpha)
                {
                    alpha = data[inIndex + 3];
                    if (!outHasAlpha)
                    {
                        alpha /= 255.0;
                        red = (1 - alpha) * bgRed + alpha * red;
                        green = (1 - alpha) * bgGreen + alpha * green;
                        blue = (1 - alpha) * bgBlue + alpha * blue;
                    }
                }
                else
                {
                    alpha = 255;
                }

                outData[outIndex] = clampByte(red);
                outData[outIndex + 1] = clampByte(green);
                outData[outIndex + 2] = clampByte(blue);
                if (outHasAlpha) outData[outIndex + 3] = clampByte(alpha);

                inIndex += inBpp;
                outIndex += outBpp;
            }
        }
        return outData;
    },

    _filter: function(pxData, width, height) {
        var filters = [
            filterNone,
            filterSub,
            filterUp,
            filterAvg,
            filterPaeth
        ];
        var filterSums = [
            filterSumNone,
            filterSumSub,
            filterSumUp,
            filterSumAvg,
            filterSumPaeth
        ];
        var filterTypes = [0]; // make it default

        /*if ((null == this._options.filterType) || (-1 === this._options.filterType))
        {
            filterTypes = [0, 1, 2, 3, 4];
        }
        else if ('number' === typeof this._options.filterType)
        {
            filterTypes = [this._options.filterType];
        }
        else
        {
            throw new Error('unrecognised filter types');
        }*/

        var bpp = COLORTYPE_TO_BPP_MAP[this._options.colorType],
            byteWidth = width * bpp,
            rawPos = 0, pxPos = 0,
            rawData = Buffer.alloc((byteWidth + 1) * height),
            sel = filterTypes[0],
            y, i, n = filterTypes.length, min, sum
        ;

        for (y = 0; y < height; y++)
        {
            if (n > 1)
            {
                // find best filter for this line (with lowest sum of values)
                min = Infinity;
                for (i=0; i<n; i++)
                {
                    sum = filterSums[filterTypes[i]](pxData, pxPos, byteWidth, bpp);
                    if (sum < min)
                    {
                        sel = filterTypes[i];
                        min = sum;
                    }
                }
            }

            rawData[rawPos] = sel;
            rawPos++;
            filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
            rawPos += byteWidth;
            pxPos += byteWidth;
        }
        return rawData;
    },

    _packChunk: function(type, data) {
        var length = data ? data.length : 0,
            buffer = Buffer.alloc(length + 12)
        ;
        I4(length, buffer, 0);
        I4(type, buffer, 4);
        if (data) data.copy(buffer, 8);
        i4(crc32(buffer.slice(4, buffer.length - 4)), buffer, buffer.length - 4);
        return buffer;
    }
};

async function read_png(buffer, metaData)
{
    var png = new PNG();
    png.readData(new Uint8Array(buffer));
    return {
        width: png.width,
        height: png.height,
        data: await png.decode()
    };
}

async function imagepng(type, img, width, height, metaData)
{
    metaData = metaData || {};
    if ('base64' === type)
    {
        if (isNode)
        {
            return 'data:image/png;base64,' + (await (new PNGPacker(metaData)).toPNG(img, width, height)).toString('base64');
        }
        else if (isBrowser)
        {
            var canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d'), imgData;

            canvas.width = width;
            canvas.height = height;

            ctx.createImageData(width, height);
            imgData = ctx.getImageData(0, 0, width, height);
            imgData.data.set(img, 0);
            ctx.putImageData(imgData, 0, 0);

            return canvas.toDataURL('image/png');
        }
    }
    else
    {
        return await (new PNGPacker(metaData)).toPNG(img, width, height);
    }
    return '';
}
