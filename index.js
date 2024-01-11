var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var RetType;
(function (RetType) {
    RetType[RetType["SUCCESS"] = 200] = "SUCCESS";
    RetType[RetType["FAIL"] = 101] = "FAIL";
    RetType[RetType["UNJOINENT"] = 405] = "UNJOINENT";
    RetType[RetType["INVALID"] = 400] = "INVALID";
})(RetType || (RetType = {}));
var baseUrl = "http://192.168.0.88:3000";
function request(input, init) {
    return new Promise(function (resolve, reject) {
        fetch("".concat(baseUrl).concat(input), __assign({}, init))
            .then(function (res) { return res.json(); })
            .then(function (rep) {
            resolve(rep);
        })
            .catch(reject);
    });
}
window.onload = function (event) {
    var input = document.getElementById("input");
    var upload = document.getElementById("upload");
    var files; //创建一个文件对象
    // let chunkList = []; //存放切片的数组
    // 读取文件
    if (input) {
        input.addEventListener("change", function (e) {
            files = e.target.files[0];
            var fileList = createChunk(files, Math.pow(1024, 2) * 1);
            console.log(fileList); //创建切片 //上传切片
            console.time("上传时间");
            uploadFile(fileList).then(function () {
                merge(files.size, files.name).then(function () {
                    console.timeEnd("上传时间");
                });
            });
        });
    }
    // 创建切片
    function createChunk(file, size) {
        if (size === void 0) { size = 2 * 1024 * 1024; }
        console.log("%c [ size ]-28-「index」", "font-size:15px; background:#1c0f58; color:#60539c;", size);
        //两个形参：file是大文件，size是切片的大小
        var chunkList = [];
        var cur = 0;
        var index = 0;
        while (cur < file.size) {
            index++;
            chunkList.push({
                file: file.slice(cur, cur + size),
                type: file.type,
                lastModified: file.lastModified,
                fileName: file.name,
                size: size,
                sort: index,
                chunkName: "".concat(file.name, "-").concat(index),
            });
            cur += size;
        }
        return chunkList;
    }
    //数据处理
    function uploadFile(list) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var requestList = list.map(function (_a) {
                            var file = _a.file, fileName = _a.fileName, index = _a.index, chunkName = _a.chunkName;
                            var formData = new FormData(); // 创建表单类型数据
                            formData.append("file", file); //该文件
                            formData.append("fileName", fileName); //文件名
                            formData.append("chunkName", chunkName); //切片名
                            return function () {
                                return new Promise(function (resolve, reject) {
                                    request("/upload", {
                                        method: "POST",
                                        body: formData,
                                    }).then(function (rep) {
                                        rep.code == RetType.SUCCESS ? resolve() : reject();
                                    });
                                });
                            };
                        });
                        sequencePromises(requestList).then(function () {
                            resolve();
                        });
                        // Promise.all(requestList).then(() => {
                        //   resolve();
                        // }); //保证所有的切片都已经传输完毕
                    })];
            });
        });
    }
    //# 按顺序执行promise
    function sequencePromises(promises) {
        return promises.reduce(function (prevPromise, nextPromise, index) {
            return prevPromise.then(function () { return nextPromise(); });
        }, Promise.resolve());
    }
};
// 通知后端去做切片合并
function merge(size, fileName) {
    return request("/merge", {
        method: "POST",
        body: JSON.stringify({
            size: size,
            fileName: fileName,
        }),
    });
}
