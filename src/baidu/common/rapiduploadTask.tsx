/*
 * @Author: mengzonefire
 * @LastEditors: tousakasp
 * @Description: 百度网盘 秒传转存任务实现
 */

import ajax from "@/common/ajax";
import { convertData, suffixChange } from "@/common/utils";
import {
  create_url,
  createdir_url,
  getBdstoken,
  illegalPathPattern,
} from "./const";
export default class RapiduploadTask {
  savePath: string;
  isDefaultPath: boolean;
  fileInfoList: Array<FileInfo>;
  accessToken: string;
  bdstoken: string;
  onFinish: (fileInfoList: Array<FileInfo>) => void;
  onProcess: (i: number, fileInfoList: Array<FileInfo>) => void;

  reset(): void {
    this.accessToken = "";
    this.bdstoken = getBdstoken();
    console.log(`bdstoken状态: ${this.bdstoken ? "获取成功" : "获取失败"}`); // debug
    this.fileInfoList = [];
    this.savePath = "";
    this.isDefaultPath = false;
    this.onFinish = () => {};
    this.onProcess = () => {};
  }

  start(): void {
    this.saveFileV2(0);
  }

  /**
   * @description: 转存秒传 接口2
   * @param {number} i
   */
  saveFileV2(i: number): void {
    if (i >= this.fileInfoList.length) {
      this.onFinish(this.fileInfoList);
      return;
    }
    this.onProcess(i, this.fileInfoList);
    let file = this.fileInfoList[i];
    let onFailed = (statusCode: number) => {
      file.errno = statusCode;
      this.saveFileV2(i + 1);
    };
    if (file.path.endsWith("/") && file.size === 0) {
      createDir.call(
        this,
        file.path.replace(/\/+$/, ''),
        (data: any) => {
          data = data.response;
          file.errno = data.errno;
          this.saveFileV2(i + 1);
        },
        onFailed
      );
      return;
    }
    // 文件名为空
    if (file.path === "/") {
      file.errno = -7;
      this.saveFileV2(i + 1);
      return;
    }
    rapiduploadCreateFile.call(
      this,
      file,
      (data: any) => {
        data = data.response;
        file.errno = 2 === data.errno ? 114 : data.errno;
        file.errno = 31190 === file.errno ? 404 : file.errno;
        this.saveFileV2(i + 1);
      },
      onFailed
    );
  }
}
export function createDir(
  path: string,
  onResponsed: (data: any) => void,
  onFailed: (statusCode: number) => void
): void {

  ajax(
    {
      url: `${createdir_url}${this.bdstoken ? "&bdstoken=" + this.bdstoken : ""}`,
      method: "POST",
      responseType: "json",
      data: convertData({
        block_list: JSON.stringify([]),
        path: this.savePath + path,
        isdir: 1,
        rtype: 3,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      }
    },
    (data) => {
      if (data.response.errno != null && 0 !== data.response.errno) {
        onFailed(data.response.errno);
      } else {
        onResponsed(data);
      }
    },
    onFailed
  );
}

const defaultRetryDelay = 200;
const retryDelayIncrement = 100;
const randomCaseRetryCount = 5;

function generateRandomInt(max : number) {
  return Math.floor(Math.random() * (max + 1));
}

function transformCase(str : string, mask : number) {
  let next = mask;
  return str.toLowerCase().split('').map(c => {
    if (c >= 'a' && c <= 'z') {
      if (next % 2 === 1) {
        c = c.toUpperCase();
      }
      next = next >> 1;
    }
    return c;
  })
  .join('');
}

export function rapiduploadCreateFile(
  file: FileInfo,
  onResponsed: (data: any) => void,
  onFailed: (statusCode: number) => void,
): void {
  let charCount = file.md5.toLowerCase().split('').filter(c => c >= 'a' && c <= 'z').length;
  let maxCombination = 1 << charCount;
  let attempts = [
    0, // 小写成功率比较高
    maxCombination - 1, // 大写
  ];
  let gen = randomCaseRetryCount;
  while (attempts.length < maxCombination && gen > 0) {
    let n : number;
    do {
      n = generateRandomInt(maxCombination - 1);
    } while (attempts.includes(n));
    attempts.push(n);
    gen--;
  }

  tryRapiduploadCreateFile.call(this, file, onResponsed, onFailed, attempts, 0, defaultRetryDelay);
}

// 此接口测试结果如下: 错误md5->返回"errno": 31190, 正确md5+错误size->返回"errno": 2
// 此外, 即使md5和size均正确, 连续请求时依旧有小概率返回"errno": 2, 故建议加入retry策略
function tryRapiduploadCreateFile(
  file: FileInfo,
  onResponsed: (data: any) => void,
  onFailed: (statusCode: number) => void,
  attempts: number[],
  attemptIndex: number,
  retryDelay: number = 0,
): void {
  const contentMd5 = transformCase(file.md5, attempts[attemptIndex]);
  //const sliceMd5 = file.md5s.toLowerCase();

  ajax(
    {
      url: `${create_url}&access_token=${encodeURIComponent(this.accessToken)}`,
      method: "POST",
      responseType: "json",
      
      data: convertData({
        block_list: JSON.stringify([contentMd5]),
        path: this.savePath + file.path.replace(illegalPathPattern, "_"),
        size: file.size,
        isdir: 0,
        rtype: 0, // rtype=3覆盖文件, rtype=0则返回报错, 不覆盖文件, 默认为rtype=1 (自动重命名, 1和2是两种不同的重命名策略)
      }),
      headers: {
        "cookie": "",
      },
      anonymous: true
    },
    (data) => {
      // console.log(data.response); // debug
      if (31039 === data.response.errno && 31039 != file.errno) {
        file.errno = 31039;
        file.path = suffixChange(file.path);
        tryRapiduploadCreateFile.call(this, file, onResponsed, onFailed, attempts, attemptIndex);
      } else if (2 === data.response.errno && attempts.length > attemptIndex + 1) {
        //console.log(`转存接口错误, 重试${retry + 1}次: ${file.path}`); // debug
        setTimeout(() => {
          tryRapiduploadCreateFile.call(this, file, onResponsed, onFailed, attempts, attemptIndex + 1, retryDelay + retryDelayIncrement);
        }, retryDelay);
      } else if (0 !== data.response.errno) {
        onFailed(data.response.errno);
      } else onResponsed(data);
    },
    onFailed
  );
}
