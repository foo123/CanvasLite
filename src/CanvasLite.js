
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
    def(self, 'src', {
        get: function() {
            return src;
        },
        set: function(s) {
            src = s;
            if (isNode)
            {
                var imgType = src.toUpperCase().split('.').pop();
                if (!Image.Reader[imgType]) err('"'+src+'" does not end in one of gif, jpg, jpeg, png!');
                require('fs').readFile(src, function(error, buffer) {
                    if (error)
                    {
                        if (self.onerror) self.onerror(error);
                        else throw error;
                        return;
                    }
                    Image.Reader[imgType](buffer)
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
    src: '',
    onload: null,
    onerror: null,
    getImageData: null
};
Image.Reader = {
    'GIF': read_gif,
    'JPG': read_jpg,
    'JPEG': read_jpg,
    'PNG': read_png
};

function CanvasLite(width, height)
{
    var self = this, imageData, rasterizer;
    if (!(self instanceof CanvasLite)) return new CanvasLite(width, height);

    imageData = {
        width: width,
        height: height,
        data: new ImArray((width*height) << 2)
    };
    rasterizer = new Rasterizer(width, height, Rasterizer.setRGBATo(imageData));

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
