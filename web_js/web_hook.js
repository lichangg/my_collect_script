//代理对象的所有方法，包括异步的
window.createLoggingProxy=function(target) {
    const handler = {
        get(target, propKey, receiver) {
            const origMethod = target[propKey];
            if (typeof origMethod === 'function') {
                return function(...args) {
                    console.log(`Calling ${propKey} with arguments:`, args);
                    let result = origMethod.apply(this, args);
                    // 如果方法是异步的（返回Promise），则需要特别处理来记录结果
                    if (result instanceof Promise) {
                        result.then(res => {
                            console.log(`Async result of ${propKey}:`, res);
                            return res;
                        }).catch(err => {
                            console.error(`Error in ${propKey}:`, err);
                            throw err;
                        });
                    } else {
                        console.log(`Result of ${propKey}:`, result);
                    }
                    return result;
                };
            }
            return origMethod;
        }
    };
    return new Proxy(target, handler);
}


//针对请求头中的加密参数，例如 anti-content ，当设置该请求头时打断点
(function() {
    // 保存原始的 setRequestHeader 方法
    var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    // 重写 setRequestHeader 方法
    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        // 检查 header 是否为 'Anti-Content'，不区分大小写
        if (header.toLowerCase() === 'anti-content'.toLowerCase()) {
            console.log(`Setting request header: ${header} = ${value}`);

            // 触发断点
            debugger;
        }

        // 调用原始的 setRequestHeader 方法
        return originalSetRequestHeader.apply(this, arguments);
    };
})();

// 监控某一个对象的某属性的某属性名
Object.defineProperty(obj.headers, 'Anti-Content', {
    set: function(value) {
        console.log(`Setting Anti-Content to: ${value}`);

        // 触发断点
        debugger;

        // 实际赋值
        this._antiContent = value;
    },
    get: function() {
        return this._antiContent;
    },
    configurable: true,
    enumerable: true
});

// 监控canvas的使用，一般现在收集指纹都会获取这个，该脚本能快速找到收集的代码位置，进而找到vmp运行位置做插桩
(function() {
    // Helper function to create a hook
    function hookMethod(obj, methodName) {
        const originalMethod = obj[methodName];
        Object.defineProperty(obj, methodName, {
            configurable: true,
            enumerable: false,
            writable: false,
            value: function(...args) {
                console.log(`[HOOKED] ${methodName} called with arguments:`, args);
                debugger; // Add a breakpoint here
                return originalMethod.apply(this, args);
            }
        });
    }

    // Hook methods of HTMLCanvasElement
    const canvasMethods = [
        'getContext', // Commonly used to retrieve 2D/WebGL contexts
        'toDataURL',  // Used to extract image data
        'toBlob'      // Used to extract image data
    ];
    canvasMethods.forEach(method => hookMethod(HTMLCanvasElement.prototype, method));

    // Hook methods of CanvasRenderingContext2D
    const canvas2DMethods = [
        'fillText', 'strokeText', 'measureText', 'drawImage',
        'getImageData', 'putImageData', 'createLinearGradient', 'createPattern',
        'createRadialGradient'
    ];
    canvas2DMethods.forEach(method => hookMethod(CanvasRenderingContext2D.prototype, method));

    // Hook methods of WebGLRenderingContext
    const webGLMethods = [
        'drawArrays', 'drawElements', 'getShaderPrecisionFormat', 'readPixels',
        'getExtension', 'getParameter'
    ];
    webGLMethods.forEach(method => hookMethod(WebGLRenderingContext.prototype, method));

    // Hook OffscreenCanvas (if supported)
    if (typeof OffscreenCanvas !== 'undefined') {
        hookMethod(OffscreenCanvas.prototype, 'getContext');
    }

    // Observe creation of new canvases dynamically
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName, ...args) {
        if (tagName.toLowerCase() === 'canvas') {
            console.log('[HOOKED] Canvas element created');
            debugger; // Add a breakpoint here
        }
        return originalCreateElement.call(document, tagName, ...args);
    };

    console.log('Canvas hooks successfully installed.');
})();


