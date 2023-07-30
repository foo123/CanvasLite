
function Image()
{
    var self = this, src = '', width = 0, height = 0, imageData = null, load;

    load = function load(buffer) {
        var imgReader = Image.Reader[Image.detectImageType(buffer)];
        if (!imgReader) err('Image file type is not supported!');
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
    };
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
        set: function(file) {
            if ((('undefined' !== typeof ArrayBuffer) && (file instanceof ArrayBuffer))
                || (('undefined' !== typeof Buffer) && (file instanceof Buffer)))
            {
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
                // https://nodejs.org/api/buffer.html#class-buffer
                load(src = file);
            }
            else if ((('undefined' !== typeof Blob) && (file instanceof Blob))
                || (('undefined' !== typeof Buffer) && (Buffer.Blob) && (file instanceof Buffer.Blob)))
            {
                // https://developer.mozilla.org/en-US/docs/Web/API/Blob
                // https://nodejs.org/api/buffer.html#class-blob
                (src = file).arrayBuffer()
                .then(function(buffer) {
                    load(buffer);
                })
                .catch(function(error) {
                    if (self.onerror) self.onerror(error);
                    else throw error;
                })
            }
            else if (isNode && (('string' === typeof file) || (file instanceof String)))
            {
                require('fs').readFile(src = file, function(error, buffer) {
                    if (error)
                    {
                        if (self.onerror) self.onerror(error);
                        else throw error;
                    }
                    else
                    {
                        load(buffer);
                    }
                });
            }
            /*else
            {
                err('Unsupported src property');
            }*/
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
    var data = new Uint8Array(buffer[buffer.subarray ? 'subarray' : 'slice'](0, 8)),
        byteAt = function(offset) {return offset < data.length ? data[offset] : 0;};
    if (0x89 === byteAt(0)
        && 0x50 === byteAt(1)
        && 0x4e === byteAt(2)
        && 0x47 === byteAt(3)
        && 0x0d === byteAt(4)
        && 0x0a === byteAt(5)
        && 0x1a === byteAt(6)
        && 0x0a === byteAt(7)
    ) return 'PNG';
    else if (0x47 === byteAt(0)
        && 0x49 === byteAt(1)
        && 0x46 === byteAt(2)
        && 0x38 === byteAt(3)
        && (0x37 === byteAt(4) || 0x39 === byteAt(4))
        && 0x61 === byteAt(5)
    ) return 'GIF';
    else if (0xff === byteAt(0)
        && 0xd8 === byteAt(1)
        /*&& 0xff === byteAt(2)
        && 0xdb === byteAt(3)*/
    ) return 'JPG';
    return 'NOT_SUPPORTED';
};
