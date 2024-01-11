//app.js
import * as http from "http";
import * as multiparty from "multiparty"; // 中间件，处理FormData对象的中间件
import * as path from "path";
import * as child_process from "child_process";
// import * as fs from "fs-extra"; //文件处理模块
import * as fs from "fs";
import * as os from "os";
const server = http.createServer();
const exec = child_process.exec;

const UPLOAD_DIR = path.resolve(__dirname, ".", "qiepian"); // 读取根目录，创建一个文件夹qiepian存放切片
function handleError(error) {
  fs.mkdirSync(__dirname, { recursive: true });
  const logFile = path.join(__dirname, "error.log");

  const date = new Date()
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
  console.log(logFile, "===>", `${date} - ${error.toString()}\n`);
  fs.appendFile(
    logFile,
    `日期:${date}
    设备信息:${os.type()} ${os.platform()} ${os.release()} 
    架构信息:${os.cpus()[0].model} ${os.arch()}
    报错信息:${error.toString()}\n`,
    (err) => {
      if (err) console.log(err);
    }
  );
}
server.on("request", async (req, res) => {
  // 处理跨域问题，允许所有的请求头和请求源
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  //   console.log(req.url);
  if (req.url === "/upload") {
    //前端访问的地址正确
    const multipart = new multiparty.Form(); // 解析FormData对象
    multipart.parse(req, async (err, fields, files) => {
      if (err) {
        //解析失败
        handleError(err);
        res.end(
          JSON.stringify({
            //向前端输出
            code: 400,
            message: String(err),
            error: err,
          })
        );
        return;
      }
      //   console.log("fields=", fields);
      //   console.log("files=", files);
      const [file] = files.file;
      console.log("file====>", file);

      const [fileName] = fields.fileName;
      const [chunkName] = fields.chunkName;

      const chunkDir = path.resolve(UPLOAD_DIR, `${fileName}-chunks`); //在qiepian文件夹创建一个新的文件夹，存放接收到的所有切片
      if (!fs.existsSync(chunkDir)) {
        //文件夹不存在，新建该文件夹
        await fs.mkdir(chunkDir, () => {});
      }
      // 把切片移动进chunkDir
      const movePath = path.join(chunkDir, chunkName);
      if (fs.existsSync(movePath)) {
        deleteFile(file.path);
        res.end(
          JSON.stringify({
            //向前端输出
            code: 200,
            message: "文件已存在",
          })
        );
        return;
      }
      try {
        console.log(
          // `上传错误${error}`,
          `文件地址：${file.path} 文件路径：${movePath}`
        );
        const data = fs.readFileSync(file.path);
        fs.writeFileSync(movePath, data);
        // 并且删除原文件
        deleteFile(file.path);
        res.end(
          JSON.stringify({
            //向前端输出
            code: 200,
            message: "切片上传成功",
          })
        );
      } catch (error) {
        handleError(error);
        res.end(
          JSON.stringify({
            //向前端输出
            code: 400,
            message: String(error),
            error,
          })
        );
      }
    });
  }
  if (req.url === "/merge") {
    console.time("合并完成");
    // 该去合并切片了
    resolvePost(req).then((data: any) => {
      const { fileName, size } = data;
      const filePath = path.resolve(UPLOAD_DIR, fileName); //获取切片路径
      mergeFileChunk(filePath, fileName, size)
        .then(() => {
          res.end(
            JSON.stringify({
              code: 200,
              message: "文件合并成功",
            })
          );
        })
        .catch((error) => {
          handleError(error);
          res.end(
            JSON.stringify({
              code: 400,
              message: String(error),
              error,
            })
          );
        });
    });
  }
});
server.listen(3000, () => {
  console.log("服务已启动", `端口地址:http://localhost:${3000}/`);
});
// 合并
function mergeFileChunk(filePath, fileName, size) {
  return new Promise((resolve, reject) => {
    const chunkDir = path.join(UPLOAD_DIR, `${fileName}-chunks`);

    fs.readdir(chunkDir, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        console.log(err);
        return;
      }
      mergeFiles(filePath, chunkDir)
        .then(resolve)
        .catch((error) => reject(error));
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
function deleteFile(filePath: string) {
  try {
    // fs.unlinkSync(filePath);
    exec(`rm -rf "${filePath}"`, (error, stdout) => {
      if (error) {
        handleError(error);
        return;
      }
      // 打印执行结果
      console.log(
        `文件存在，执行删除 ${filePath}`,
        `error: ${error}`,
        `stdout: ${stdout}`
      );
      console.log(`${filePath}已成功删除！`);
    });
  } catch (error) {
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
  return new Promise<void>((resolve, reject) => {
    //获取或有文件名称
    fs.readdir(dirPath, (error, files) => {
      if (error) {
        console.log(error);
        handleError(error);
        return;
      }
      let chunkPaths = files;
      //文件排序
      chunkPaths.sort(
        (a, b) => Number(a.match(/\d+$/g)) - Number(b.match(/\d+$/g))
      );
      const writeStream = fs.createWriteStream(filePath);
      const chunks: any = [];
      // 获取所有分块文件的路径
      for (const url of chunkPaths) {
        chunks.push(path.join(dirPath, url));
      }
      console.log(chunks);
      if (!chunks?.length) {
        reject("未找到文件");
      }
      // 将所有分块文件合并到目标文件中;
      let index = 0;

      const mergeBlob = () => {
        const readStream = fs.createReadStream(chunks[index]);
        readStream.pipe(writeStream, { end: false });
        readStream.on("end", () => {
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
      writeStream.on("close", () => {
        console.log("所有分块文件已合并！");
      });
    });
  });
}
// 解析POST请求传递的参数
function resolvePost(req) {
  // 解析参数
  return new Promise((resolve) => {
    let chunk = "";
    req.on("data", (data) => {
      //req接收到了前端的数据
      chunk += data; //将接收到的所有参数进行拼接
    });
    req.on("end", () => {
      resolve(JSON.parse(chunk)); //将字符串转为JSON对象
    });
  });
}
