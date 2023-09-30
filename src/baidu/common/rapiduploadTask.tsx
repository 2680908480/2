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

// 此接口测试结果如下: 错误md5->返回"errno": 31190, 正确md5+错误size->返回"errno": 2
// 此外, 即使md5和size均正确, 连续请求时依旧有小概率返回"errno": 2, 故建议加入retry策略
// header内添加"Content-Type": "application/x-www-form-urlencoded"，默认type为text导致随机#2
// openapi 接口无需重试不用写法
export function rapiduploadCreateFile(
  file: FileInfo,
  onResponsed: (data: any) => void,
  onFailed: (statusCode: number) => void,
): void {
  const contentMd5 = file.md5.toLowerCase();

  const retryPolicy = {
    max: 1,
    delay: 500,
    accepts(statusCode: number, response: any): boolean {
      if (statusCode == 200) {
        if (response != null && response.errno === 2) {
          return false;
        }
        return true;
      }
      const statusClass = Math.floor(statusCode / 100);
      if (statusClass <= 3)
        return true;
      if (statusCode === 403 || statusCode === 404)
        return true;
      return false;
    }
  };
  
  ajax(
    {
      url: `${create_url}&access_token=${encodeURIComponent(this.accessToken)}${this.bdstoken ? "&bdstoken=" + this.bdstoken : ""}`, // bdstoken参数不能放在data里, 否则无效
      method: "POST",
      responseType: "json",
      
      data: convertData({
        block_list: JSON.stringify([contentMd5]),
        path: this.savePath + file.path.replace(illegalPathPattern, "_").replace(/\.rar$/, '.RAR'),
        size: file.size,
        isdir: 0,
        rtype: 0, // rtype=3覆盖文件, rtype=0则返回报错, 不覆盖文件, 默认为rtype=1 (自动重命名, 1和2是两种不同的重命名策略)
      }),
      headers: {
        "cookie": "",
      },
    },
    (data) => {
      // console.log(data.response); // debug
      if (31039 === data.response.errno && 31039 != file.errno) {
        file.errno = 31039;
        file.path = suffixChange(file.path);
        rapiduploadCreateFile.call(this, file, onResponsed, onFailed);
      } else if (0 !== data.response.errno) {
        onFailed(data.response.errno);
      } else onResponsed(data);
    },
    onFailed,
    retryPolicy
  );
}
