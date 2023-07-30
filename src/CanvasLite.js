
function Image()
{
    var self = this, src = '', width = 0, height = 0, imageData = null;

    def(self, 'width', {
        get: function() {
            return width;
        },
        set: function(w) {
        }
    });
    def(self, 'height', {
        get: function() {
            return height;
        },
        set: function(h) {
        }
    });
    def(self, 'naturalWidth', {
        get: function() {
            return width;
        },
        set: function(w) {
        }
    });
    def(self, 'naturalHeight', {
        get: function() {
            return height;
        },
        set: function(h) {
        }
    });
    def(self, 'src', {
        get: function() {
            return src;
        },
        set: function(s) {
            src = String(s);
            if (isNode)
            {
                require('fs').readFile(src, function(error, buffer) {
                    if (error)
                    {
                        if (self.onerror) self.onerror(error);
                        else throw error;
                        return;
                    }
                    var imgReader = Image.Reader[Image.detectImageType(buffer)];
                    if (!imgReader) err('"'+src+'" image type is not supported!');
                    imgReader(buffer)
                    .then(function(imgData) {
                        imageData = imgData;
                        width = imgData.width;
                        height = imgData.height;
                        if (self.onload) self.onload();
                    })
                    .catch(function(error) {
                        if (self.onerror) self.onerror(error);
                        else throw error;
                    });
                });
            }
        }
    });
    self.getImageData = function() {
        return imageData;
    };
}
Image[PROTO] = {
    constructor: Image,
    width: 0,
    height: 0,
    naturalWidth: 0,
    naturalHeight: 0,
    src: '',
    onload: null,
    onerror: null,
    getImageData: null
};
Image.Reader = {
    'NOT_SUPPORTED': null,
    'GIF': read_gif,
    'JPG': read_jpg,
    'PNG': read_png
};
Image.detectImageType = function(buffer) {
    // https://en.wikipedia.org/wiki/List_of_file_signatures
    var data = new Uint8Array(buffer),
        readByte = function(offset) {return offset < data.length ? data[offset++] : 0;};
    if (0x89 === readByte(0)
        && 0x50 === readByte(1)
        && 0x4e === readByte(2)
        && 0x47 === readByte(3)
        && 0x0d === readByte(4)
        && 0x0a === readByte(5)
        && 0x1a === readByte(6)
        && 0x0a === readByte(7)
    ) return 'PNG';
    else if (0x47 === readByte(0)
        && 0x49 === readByte(1)
        && 0x46 === readByte(2)
        && 0x38 === readByte(3)
        && (0x37 === readByte(4) || 0x39 === readByte(4))
        && 0x61 === readByte(5)
    ) return 'GIF';
    else if (0xff === readByte(0)
        && 0xd8 === readByte(1)
        && 0xff === readByte(2)
        && 0xdb === readByte(3)
    ) return 'JPG';
    return 'NOT_SUPPORTED';
};

function CanvasLite(width, height)
{
    var self = this, imageData, rasterizer, reset;
    if (!(self instanceof CanvasLite)) return new CanvasLite(width, height);

    reset = function() {
        width = width || 0;
        height = height || 0;
        if (rasterizer) rasterizer.dispose();
        imageData = {
            width: width,
            height: height,
            data: new ImArray((width*height) << 2)
        };
        rasterizer = new Rasterizer(width, height, Rasterizer.setRGBATo(imageData));
    };

    def(self, 'width', {
        get: function() {
            return width;
        },
        set: function(w) {
            w = +w;
            if (!is_nan(w) && is_finite(w) && 0 <= w)
            {
                if (width !== w)
                {
                    width = w;
                    reset();
                }
            }
        }
    });
    def(self, 'height', {
        get: function() {
            return height;
        },
        set: function(h) {
            h = +h;
            if (!is_nan(h) && is_finite(h) && 0 <= h)
            {
                if (height !== h)
                {
                    height = h;
                    reset();
                }
            }
        }
    });
    self.getContext = function(type) {
        return rasterizer.getContext(type);
    };
    self.toDataURL = async function(type, encoderOptions) {
        // only PNG output format
        return await imagepng('base64', imageData.data, imageData.width, imageData.height/*, encoderOptions*/);
    };
    self.toBlob = function(cb) {
        if (('undefined' !== typeof Blob) && cb)
        {
            // only PNG output format
            imagepng('binary', imageData.data, imageData.width, imageData.height/*, encoderOptions*/).then(function(png) {
                cb(new Blob(png, {type:'image/png'}));
            }).catch(function() {});
        }
    };
    self.toPNG = async function() {
        // only PNG output format
        return await imagepng('binary', imageData.data, imageData.width, imageData.height/*, encoderOptions*/);
    };
    reset();
}
CanvasLite[PROTO] = {
    constructor: CanvasLite,
    width: 0,
    height: 0,
    getContext: null,
    toDataURL: null,
    toBlob: null,
    toPNG: null
};
CanvasLite.Image = Image;
CanvasLite.RenderingContext2D = Rasterizer.RenderingContext2D;
