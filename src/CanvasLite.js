
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
        if ('function' === typeof cb)
        {
            var blobClass = 'undefined' !== typeof Blob ? Blob : (('undefined' !== typeof Buffer) && Buffer.Blob ? Buffer.Blob : null);
            if (blobClass)
            {
                // only PNG output format
                imagepng('binary', imageData.data, imageData.width, imageData.height)
                .then(function(png) {
                    cb(new blobClass([png], {type:'image/png'}));
                })
                .catch(NOOP);
            }
        }
    };
    self.toPNG = async function() {
        // only PNG output format
        return await imagepng('binary', imageData.data, imageData.width, imageData.height/*, {deflateLevel: 0}*/);
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
CanvasLite.VERSION = "@@VERSION@@";
CanvasLite.Image = Image;
CanvasLite.RenderingContext2D = Rasterizer.RenderingContext2D;
