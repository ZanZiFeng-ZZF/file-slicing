type FileObject = Partial<
  File & {
    file: File;
    sort: number;
    chunkName: string;
    fileName: string;
  }
>;
enum RetType {
  SUCCESS = 200,
  FAIL = 101,
  UNJOINENT = 405,
  INVALID = 400,
}
const baseUrl = "http://192.168.0.88:3000";
function request(input: RequestInfo | URL, init?: RequestInit): Promise<any> {
  return new Promise((resolve, reject) => {
    fetch(`${baseUrl}${input}`, {
      ...init,
    })
      .then((res: any) => res.json())
      .then((rep) => {

        resolve(rep);
      })
      .catch(reject);
  });
}
window.onload = (event) => {
  let input = document.getElementById("input");
  let upload = document.getElementById("upload");
  let files: File; //创建一个文件对象
  // let chunkList = []; //存放切片的数组
  // 读取文件
  if (input) {
    input.addEventListener("change", (e: any) => {
      files = e.target.files[0];

      const fileList = createChunk(files, 1024 ** 2 * 1);
      console.log(fileList); //创建切片 //上传切片
      console.time("上传时间");
      uploadFile(fileList).then(() => {
        merge(files.size, files.name).then(() => {
          console.timeEnd("上传时间");
        });
      });
    });
  }
  // 创建切片
  function createChunk(file: File, size = 2 * 1024 * 1024) {
    console.log(
      "%c [ size ]-28-「index」",
      "font-size:15px; background:#1c0f58; color:#60539c;",
      size
    );
    //两个形参：file是大文件，size是切片的大小
    const chunkList: FileObject[] = [];
    let cur = 0;
    let index = 0;
    while (cur < file.size) {
      index++;
      chunkList.push({
        file: file.slice(cur, cur + size) as File, //使用slice()进行切片
        type: file.type,
        lastModified: file.lastModified,
        fileName: file.name,
        size,
        sort: index,
        chunkName: `${file.name}-${index}`,
      });
      cur += size;
    }
    return chunkList;
  }
  //数据处理
  async function uploadFile(list) {
    return new Promise<void>((resolve, reject) => {
      const requestList = list.map(({ file, fileName, index, chunkName }) => {
        const formData = new FormData(); // 创建表单类型数据
        formData.append("file", file); //该文件
        formData.append("fileName", fileName); //文件名
        formData.append("chunkName", chunkName); //切片名
        return () =>
          new Promise<string | void>((resolve, reject) => {
            request(`/upload`, {
              method: "POST",
              body: formData,
            }).then((rep) => {
              rep.code == RetType.SUCCESS ? resolve() : reject();
            });
          });
      });
      sequencePromises(requestList).then(() => {
        resolve();

      });
      // Promise.all(requestList).then(() => {
      //   resolve();
      // }); //保证所有的切片都已经传输完毕
    });
  }
  //# 按顺序执行promise
  function sequencePromises(promises: Array<() => Promise<any>>) {
    return promises.reduce((prevPromise, nextPromise, index) => {
      return prevPromise.then(() => nextPromise());
    }, Promise.resolve());
  }
};
// 通知后端去做切片合并
function merge(size: number, fileName: string) {
  return request(`/merge`, {
    method: "POST",
    body: JSON.stringify({
      size,
      fileName,
    }),
  });
}
