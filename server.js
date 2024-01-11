"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
//app.js
var http = require("http");
var multiparty = require("multiparty"); // 中间件，处理FormData对象的中间件
var path = require("path");
var child_process = require("child_process");
// import * as fs from "fs-extra"; //文件处理模块
var fs = require("fs");
var os = require("os");
var server = http.createServer();
var exec = child_process.exec;
var UPLOAD_DIR = path.resolve(__dirname, ".", "qiepian"); // 读取根目录，创建一个文件夹qiepian存放切片
function handleError(error) {
    fs.mkdirSync(__dirname, { recursive: true });
    var logFile = path.join(__dirname, "error.log");
    var date = new Date()
        .toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    })
        .replace(/\//g, "-");
    console.log(logFile, "===>", "".concat(date, " - ").concat(error.toString(), "\n"));
    fs.appendFile(logFile, "\u65E5\u671F:".concat(date, "\n    \u8BBE\u5907\u4FE1\u606F:").concat(os.type(), " ").concat(os.platform(), " ").concat(os.release(), " \n    \u67B6\u6784\u4FE1\u606F:").concat(os.cpus()[0].model, " ").concat(os.arch(), "\n    \u62A5\u9519\u4FE1\u606F:").concat(error.toString(), "\n"), function (err) {
        if (err)
            console.log(err);
    });
}
server.on("request", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var multipart;
    return __generator(this, function (_a) {
        // 处理跨域问题，允许所有的请求头和请求源
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        //   console.log(req.url);
        if (req.url === "/upload") {
            multipart = new multiparty.Form();
            multipart.parse(req, function (err, fields, files) { return __awaiter(void 0, void 0, void 0, function () {
                var file, fileName, chunkName, chunkDir, movePath, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (err) {
                                //解析失败
                                handleError(err);
                                res.end(JSON.stringify({
                                    //向前端输出
                                    code: 400,
                                    message: String(err),
                                    error: err,
                                }));
                                return [2 /*return*/];
                            }
                            file = files.file[0];
                            console.log("file====>", file);
                            fileName = fields.fileName[0];
                            chunkName = fields.chunkName[0];
                            chunkDir = path.resolve(UPLOAD_DIR, "".concat(fileName, "-chunks"));
                            if (!!fs.existsSync(chunkDir)) return [3 /*break*/, 2];
                            //文件夹不存在，新建该文件夹
                            return [4 /*yield*/, fs.mkdir(chunkDir, function () { })];
                        case 1:
                            //文件夹不存在，新建该文件夹
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            movePath = path.join(chunkDir, chunkName);
                            if (fs.existsSync(movePath)) {
                                deleteFile(file.path);
                                res.end(JSON.stringify({
                                    //向前端输出
                                    code: 200,
                                    message: "文件已存在",
                                }));
                                return [2 /*return*/];
                            }
                            try {
                                console.log(
                                // `上传错误${error}`,
                                "\u6587\u4EF6\u5730\u5740\uFF1A".concat(file.path, " \u6587\u4EF6\u8DEF\u5F84\uFF1A").concat(movePath));
                                data = fs.readFileSync(file.path);
                                fs.writeFileSync(movePath, data);
                                // 并且删除原文件
                                deleteFile(file.path);
                                res.end(JSON.stringify({
                                    //向前端输出
                                    code: 200,
                                    message: "切片上传成功",
                                }));
                            }
                            catch (error) {
                                handleError(error);
                                res.end(JSON.stringify({
                                    //向前端输出
                                    code: 400,
                                    message: String(error),
                                    error: error,
                                }));
                            }
                            return [2 /*return*/];
                    }
                });
            }); });
        }
        if (req.url === "/merge") {
            console.time("合并完成");
            // 该去合并切片了
            resolvePost(req).then(function (data) {
                var fileName = data.fileName, size = data.size;
                var filePath = path.resolve(UPLOAD_DIR, fileName); //获取切片路径
                mergeFileChunk(filePath, fileName, size)
                    .then(function () {
                    res.end(JSON.stringify({
                        code: 200,
                        message: "文件合并成功",
                    }));
                })
                    .catch(function (error) {
                    handleError(error);
                    res.end(JSON.stringify({
                        code: 400,
                        message: String(error),
                        error: error,
                    }));
                });
            });
        }
        return [2 /*return*/];
    });
}); });
server.listen(3000, function () {
    console.log("服务已启动", "\u7AEF\u53E3\u5730\u5740:http://localhost:".concat(3000, "/"));
});
// 合并
function mergeFileChunk(filePath, fileName, size) {
    return new Promise(function (resolve, reject) {
        var chunkDir = path.join(UPLOAD_DIR, "".concat(fileName, "-chunks"));
        fs.readdir(chunkDir, function (err) {
            if (err) {
                console.log(err);
                return;
            }
            mergeFiles(filePath, chunkDir)
                .then(resolve)
                .catch(function (error) { return reject(error); });
        });
        //保证所有的切片都被读取
    });
}
/**
 * @description: 删除文件
 * @param {string} filePath 删除文件路径
 * @return {*}
 * @Date: 2023-04-10 10:58:26
 */
function deleteFile(filePath) {
    try {
        // fs.unlinkSync(filePath);
        exec("rm -rf \"".concat(filePath, "\""), function (error, stdout) {
            if (error) {
                handleError(error);
                return;
            }
            // 打印执行结果
            console.log("\u6587\u4EF6\u5B58\u5728\uFF0C\u6267\u884C\u5220\u9664 ".concat(filePath), "error: ".concat(error), "stdout: ".concat(stdout));
            console.log("".concat(filePath, "\u5DF2\u6210\u529F\u5220\u9664\uFF01"));
        });
    }
    catch (error) {
        handleError(error);
        console.log("[ error ] >", error);
    }
}
/**
 * 将多个分块文件合并到一个文件中
 * @param filePath 目标文件路径
 * @param dirPath 分块文件所在目录路径
 * @param numOfChunks 分块文件数量
 */
function mergeFiles(filePath, dirPath) {
    return new Promise(function (resolve, reject) {
        //获取或有文件名称
        fs.readdir(dirPath, function (error, files) {
            if (error) {
                console.log(error);
                handleError(error);
                return;
            }
            var chunkPaths = files;
            //文件排序
            chunkPaths.sort(function (a, b) { return Number(a.match(/\d+$/g)) - Number(b.match(/\d+$/g)); });
            var writeStream = fs.createWriteStream(filePath);
            var chunks = [];
            // 获取所有分块文件的路径
            for (var _i = 0, chunkPaths_1 = chunkPaths; _i < chunkPaths_1.length; _i++) {
                var url = chunkPaths_1[_i];
                chunks.push(path.join(dirPath, url));
            }
            console.log(chunks);
            if (!(chunks === null || chunks === void 0 ? void 0 : chunks.length)) {
                reject("未找到文件");
            }
            // 将所有分块文件合并到目标文件中;
            var index = 0;
            var mergeBlob = function () {
                var readStream = fs.createReadStream(chunks[index]);
                readStream.pipe(writeStream, { end: false });
                readStream.on("end", function () {
                    // fs.unlinkSync(chunks[index]);
                    if (chunks[index] == chunks.at(-1)) {
                        if (fs.existsSync(dirPath)) {
                            deleteFile(dirPath);
                            console.timeEnd("合并完成");
                        }
                        resolve();
                        return;
                    }
                    index++;
                    mergeBlob();
                });
            };
            mergeBlob();
            // 合并完成后输出提示信息
            writeStream.on("close", function () {
                console.log("所有分块文件已合并！");
            });
        });
    });
}
// 解析POST请求传递的参数
function resolvePost(req) {
    // 解析参数
    return new Promise(function (resolve) {
        var chunk = "";
        req.on("data", function (data) {
            //req接收到了前端的数据
            chunk += data; //将接收到的所有参数进行拼接
        });
        req.on("end", function () {
            resolve(JSON.parse(chunk)); //将字符串转为JSON对象
        });
    });
}
