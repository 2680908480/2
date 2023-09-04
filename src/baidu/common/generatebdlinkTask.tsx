/*
 * @Author: mengzonefire
 * @LastEditors: tousakasp
 * @Description: 百度网盘 秒传生成任务实现
 */

import ajax from "@/common/ajax";
import {
  convertData,
  decryptMd5,
  getExtra,
  getLogid,
  getSurl,
  showAlert,
} from "@/common/utils";
import { UA } from "@/common/const";
import {
  list_url,
  meta_url,
  meta_url2,
  pcs_url,
  tpl_url,
  sharedownload_url,
  sharelist_url,
  getBdstoken,
  listLimit,
} from "./const";
// import { createFileV2 } from "./rapiduploadTask";
// import SparkMD5 from "spark-md5";
// import { rapiduploadCreateFile } from "./rapiduploadTask";

const listMinDelayMsec = 1000;
const retryDelaySec = 30;

// 普通生成:
export default class GeneratebdlinkTask {
  isSharePage: boolean; // 分享页标记
  isGenView: boolean; // 生成页(秒传框输入gen)标记
  recursive: boolean; // 递归生成标记
  savePath: string;
  dirList: Array<string>;
  selectList: Array<any>;
  fileInfoList: Array<FileInfo>;
  logid: string;
  surl: string;
  bdstoken: string;
  onFinish: (fileInfoList: Array<FileInfo>) => void;
  onProcess: (i: number, fileInfoList: Array<FileInfo>) => void;
  onProgress: (e: any, text?: string) => void;
  onHasDir: () => void;
  onHasNoDir: () => void;

  reset(): void {
    this.isGenView = false;
    this.isSharePage = false;
    this.recursive = false;
    this.savePath = "";
    this.bdstoken = getBdstoken(); // 此处bdstoken不可删除, 会在下方createFileV2方法调用
    this.dirList = [];
    this.selectList = [];
    this.fileInfoList = [];
    this.onFinish = () => {};
    this.onProcess = () => {};
    this.onProgress = () => {};
    this.onHasDir = () => {};
    this.onHasNoDir = () => {};
  }

  /**
   * @description: 执行新任务的初始化步骤 扫描选择的文件列表
   */
  start(): void {
    if (this.isSharePage) {
      this.logid = getLogid();
      this.surl = getSurl();
      if (!this.surl) {
        showAlert(
          "surl获取失败"
        );
        return;
      }
      this.parseShareFileList();
      this.onHasNoDir();
    } else {
      this.parseMainFileList();
      if (this.dirList.length) this.onHasDir();
      else this.onHasNoDir();
    }
  }

  scanShareFile(i: number, page: number = 1, retryAllowed: number = 5): void {
    if (i >= this.dirList.length) {
      this.generateBdlink(0);
      return;
    }
    this.onProgress(false, `正在获取文件列表, 第${i + 1}个`);
    const shareid = unsafeWindow.yunData ? unsafeWindow.yunData.shareid : unsafeWindow.locals.shareid;
    const uk = unsafeWindow.yunData ? unsafeWindow.yunData.share_uk : unsafeWindow.locals.share_uk;
    ajax(
      {
        url: `${sharelist_url}&dir=${encodeURIComponent(this.dirList[i])}&logid=${this.logid}&shareid=${shareid}&uk=${uk}&page=${page}`,
        method: "GET",
        responseType: "json",
      },
      (data) => {
        data = data.response;
        if (!data.errno) {
          if (!data.list.length) {
            // 返回列表为空, 即此文件夹文件全部扫描完成
            if (page === 1) {
              this.fileInfoList.push({
                path: this.dirList[i] + '/',
                size: 0,
                fs_id: '',
                md5: '00000000000000000000000000000000',
                md5s: '',
              });
            }
            setTimeout(() => {
              this.scanShareFile(i + 1);
            }, listMinDelayMsec);
          } else {
            this.parseShareFileList(data.list);
            if (data.list.length >= listLimit) {
              setTimeout(() => {
                this.scanShareFile(i, page + 1); // 下一页
              }, listMinDelayMsec);
            } else {
              setTimeout(() => {
                this.scanShareFile(i + 1);
              }, listMinDelayMsec);
            }
          }
        } else {
          this.fileInfoList.push({
            path: this.dirList[i],
            isdir: 1,
            errno: data.errno,
          }); // list接口访问失败, 添加失败信息
          setTimeout(() => {
            this.scanShareFile(i + 1);
          }, listMinDelayMsec);
        }
      },
      (statusCode) => {
        if (statusCode === 400 && retryAllowed > 0) { // rate limit
          this.onProgress(false, `${retryDelaySec}秒后重试 ...`);
          setTimeout(() => {
            this.scanShareFile(i, page, retryAllowed - 1);
          }, listMinDelayMsec + retryDelaySec * 1000);
        } else {
          this.fileInfoList.push({
            path: this.dirList[i],
            errno: statusCode,
          });
          setTimeout(() => {
            this.scanShareFile(i + 1);
          }, listMinDelayMsec);
        }
      }
    );
  }

  /**
   * @description: 选择的列表包含文件夹, 获取文件夹下的子文件
   * @param {number} i 条目index
   * @param {number} start 列表接口检索起点(即翻页参数)
   */
  scanFile(i: number, start: number = 0, retryAllowed: number = 5): void {
    if (i >= this.dirList.length) {
      this.generateBdlink(0);
      return;
    }
    ajax(
      {
        url: `${list_url}${encodeURIComponent(this.dirList[i])}&recursion=${
          this.recursive ? 1 : 0
        }&start=${start}`,
        method: "GET",
        responseType: "json",
      }, // list接口自带递归参数recursion
      (data) => {
        data = data.response;
        if (!data.errno) {
          if (!data.list.length) {
            // 返回列表为空, 即此文件夹文件全部扫描完成
            if (start === 0) {
              this.fileInfoList.push({
                path: this.dirList[i] + '/',
                size: 0,
                fs_id: '',
                md5: '00000000000000000000000000000000',
                md5s: '',
              });
            }
            setTimeout(() => {
              this.scanFile(i + 1);
            }, listMinDelayMsec);
          } else {
            data.list.forEach((item: any) => {
              if (!item.isdir) {
                this.fileInfoList.push({
                  path: item.path,
                  size: item.size,
                  fs_id: item.fs_id,
                  md5: "",
                  md5s: "",
                }); // 筛选文件(isdir=0)
              }
            });
            if (data.has_more) {
              setTimeout(() => {
                this.scanFile(i, start + listLimit); // 从下一个起点继续检索列表
              }, listMinDelayMsec);
            } else {
              setTimeout(() => {
                this.scanFile(i + 1);
              }, listMinDelayMsec);
            }
          }
        } else {
          this.fileInfoList.push({
            path: this.dirList[i],
            isdir: 1,
            errno: data.errno,
          }); // list接口访问失败, 添加失败信息
          setTimeout(() => {
            this.scanFile(i + 1);
          }, listMinDelayMsec);
        }
      },
      (statusCode) => {
        if (statusCode === 400 && retryAllowed > 0) { // rate limit
          this.onProgress(false, `${retryDelaySec}秒后重试 ...`);
          setTimeout(() => {
            this.scanFile(i, start, retryAllowed - 1);
          }, listMinDelayMsec + retryDelaySec * 1000);
        } else {
          this.fileInfoList.push({
            path: this.dirList[i],
            errno: statusCode,
          });
          setTimeout(() => {
            this.scanFile(i + 1);
          }, listMinDelayMsec);
        }
      }
    );
  }

  /**
   * @description: 顺序执行生成任务
   * @param {number} i
   */
  generateBdlink(i: number): void {
    // 保存任务进度数据, 分享页生成不保存
    if (!this.isSharePage)
      GM_setValue("unfinish", {
        file_info_list: this.fileInfoList,
        file_id: i,
      });
    // 生成完成
    if (i >= this.fileInfoList.length) {
      this.onFinish(this.fileInfoList);
      return;
    }
    let file = this.fileInfoList[i];
    if (file.fs_id === '') {
      this.generateBdlink(i + 1);
    } else {
      //  刷新弹窗内的任务进度
      this.onProcess(i, this.fileInfoList);
      // 跳过扫描失败的目录路径
      if (file.errno && file.isdir) {
        this.generateBdlink(i + 1);
        return;
      }
      // 普通生成步骤
      this.isSharePage ? this.getShareDlink(i) : this.getDlink(i);
    }
  }

  /**
   * @description: 获取文件信息: size, md5(可能错误), fs_id
   * @param {number} i
   */
  getFileInfo(i: number): void {
    let file = this.fileInfoList[i];
    ajax(
      {
        url: meta_url + encodeURIComponent(file.path),
        responseType: "json",
        method: "GET",
      },
      (data) => {
        data = data.response;
        if (!data.error_code) {
          if (data.list[0].isdir) {
            file.isdir = 1;
            file.errno = 900;
            this.generateBdlink(i + 1);
            return;
          }
          file.size = data.list[0].size;
          file.fs_id = data.list[0].fs_id;
          // 已开启极速生成, 直接取meta内的md5
          file.md5 = "";
          file.md5s = "";
          this.getDlink(i);
        } else {
          file.errno = data.error_code;
          this.generateBdlink(i + 1);
        }
      },
      (statusCode) => {
        file.errno = statusCode === 404 ? 909 : statusCode;
        this.generateBdlink(i + 1);
      }
    );
  }

  /**
   * @description: 获取分享页的文件dlink(下载直链)
   * @param {number} i
   */
  getShareDlink(i: number): void {
    let sign: string,
      timestamp: number,
      file = this.fileInfoList[i],
      onFailed = (errno: number) => {
        file.errno = errno;
        this.getShareDlink(i + 1);
        // md5为空只在分享单个文件时出现, 故无需考虑获取多文件md5(跳转generateBdlink), 直接跳转checkMd5即可
      };
    function getTplconfig(file: FileInfo): void {
      ajax(
        {
          url: `${tpl_url}&surl=${this.surl}&logid=${this.logid}`,
          responseType: "json",
          method: "GET",
        },
        (data) => {
          data = data.response;
          // 请求正常
          if (!data.errno) {
            sign = data.data.sign;
            timestamp = data.data.timestamp;
            getDlink.call(this, file);
            return;
          }
          // 请求报错
          onFailed(data.errno);
        },
        onFailed
      );
    }
    function getDlink(file: FileInfo): void {
      ajax(
        {
          url: `${sharedownload_url}&sign=${sign}&timestamp=${timestamp}`,
          responseType: "json",
          method: "POST",
          data: convertData({
            extra: getExtra(),
            logid: this.logid,
            fid_list: JSON.stringify([file.fs_id]),
            primaryid: unsafeWindow.yunData ? unsafeWindow.yunData.shareid : unsafeWindow.locals.shareid,
            uk: unsafeWindow.yunData ? unsafeWindow.yunData.share_uk : unsafeWindow.locals.share_uk,
            product: "share",
            encrypt: 0,
          }),
        },
        (data) => {
          data = data.response;
          // 请求正常
          if (!data.errno) {
            this.downloadFileData(i, data.list[0].dlink);
            return;
          }
          // 请求报错
          onFailed(data.errno);
        },
        onFailed
      );
    }
    getTplconfig.call(this, file);
  }

  /**
   * @description: 获取文件dlink(下载直链)
   * @param {number} i
   */
  getDlink(i: number): void {
    let file = this.fileInfoList[i];

    // 使用生成页时仅有path没有fs_id, 跳转到获取fs_id
    if (!file.fs_id) {
      this.getFileInfo(i);
      return;
    }
    ajax(
      {
        url: meta_url2 + JSON.stringify([String(file.fs_id)]),
        responseType: "json",
        method: "GET",
        headers: { "User-Agent": UA },
      },
      (data) => {
        data = data.response;
        // 请求正常
        if (!data.errno) {
          this.downloadFileData(i, data.info[0].dlink);
          return;
        }
        // 请求报错
        file.errno = data.errno;
        this.generateBdlink(i + 1);
      },
      (statusCode) => {
        file.errno = statusCode;
        this.generateBdlink(i + 1);
      }
    );
  }

  /**
   * @description: 调用下载直链
   * @param {number} i
   * @param {string} dlink
   */
  downloadFileData(i: number, dlink: string): void {
    let file = this.fileInfoList[i];
    //let dlSize = file.size < 262144 ? 1 : 262143; //slice-md5: 文件前256KiB的md5, size<256KiB则直接取md5即可, 无需下载文件数据
    let dlSize = 1;
    ajax(
      {
        url: dlink,
        method: "GET",
        responseType: "arraybuffer",
        headers: {
          Range: `bytes=0-${dlSize}`,
          "User-Agent": UA,
        },
        onprogress: this.onProgress,
      },
      (data) => {
        this.onProgress({ loaded: 100, total: 100 }); // 100%
        this.parseDownloadData(i, data);
      },
      (statusCode) => {
        if (statusCode === 404) file.errno = 909;
        else file.errno = statusCode;
        this.generateBdlink(i + 1);
      }
    );
  }

  /**
   * @description: 解析直链请求返回的数据
   * @param {number} i
   * @param {any} data
   */
  parseDownloadData(i: number, data: any): void {
    let file = this.fileInfoList[i];
    console.log(`dl_url: ${data.finalUrl}`); // debug
    // 下载直链重定向到此域名, 判定为文件和谐
    if (data.finalUrl.includes("issuecdn.baidupcs.com")) {
      file.errno = 1919;
      this.generateBdlink(i + 1);
      return;
    }
    // 从下载接口获取md5, 此步骤可确保获取到正确md5
    let fileMd5 = data.responseHeaders.match(/content-md5: ([\da-f]{32})/i);
    if (fileMd5) file.md5 = fileMd5[1];
    else if (file.size <= 3900000000 && !file.retry_996 && !this.isSharePage) {
      // 默认下载接口未拿到md5, 尝试使用旧下载接口, 旧接口请求文件size大于3.9G会返回403
      // 分享页的生成任务不要调用旧接口
      file.retry_996 = true;
      this.downloadFileData(
        i,
        pcs_url + `&path=${encodeURIComponent(file.path)}`
      );
      return;
    } else {
      // 两个下载接口均未拿到md5, 失败跳出
      file.errno = 996;
      this.generateBdlink(i + 1);
      return;
    }

    file.md5s = ''; // use short link only, skip md5s

    /*
    // 获取md5s, "极速生成" 跳过此步
    if (file.size < 262144) file.md5s = file.md5; // 此时md5s=md5
    else {
      // 计算md5s
      let spark = new SparkMD5.ArrayBuffer();
      spark.append(data.response);
      let sliceMd5 = spark.end();
      file.md5s = sliceMd5;
    }
    */
    let interval = this.fileInfoList.length > 1 ? 2000 : 1000;
    setTimeout(() => {
      this.generateBdlink(i + 1);
    }, interval);
  }

  /**
   * @description: "极速生成" 可能得到错误md5, 故执行验证步骤, 若验证不通过则执行普通生成
   * @param {number} i
   */
  checkMd5(i: number): void {
    if (i >= this.fileInfoList.length) {
      this.onFinish(this.fileInfoList);
      return;
    }
    let file = this.fileInfoList[i];
    // 跳过扫描失败的目录路径
    if (file.errno && file.isdir) {
      this.checkMd5(i + 1);
      return;
    }
    this.onProcess(i, this.fileInfoList);
    this.onProgress(false, "极速生成中...");
    this.isSharePage ? this.getShareDlink(i) : this.getDlink(i);
    // this.isSharePage ? this.getShareDlink(i) : this.getDlink(i);
    // 23.4.27: 错误md5在文件上传者账号使用此接口正常转存, 在其他账号则报错#404(#31190), 导致生成秒传完全无法验证, 故弃用meta内的md5
    // 23.5.4: 发现错误md5只要改成大写, 在上传者账号就能正常返回#31190, 而正确md5则大小写都能正常转存, 故重新启用此验证过程
    // 主要是因为频繁请求直链接口获取正确md5会导致#9019错误(即账号被限制), 对大批量生成秒传有很大影响, 极速生成功能使用此验证则可以节约请求以避免此问题
    // 为避免百度后面又改接口导致生成错误秒传问题, 这个接口特性我会写个定时脚本每天测试一次, 出了问题就能即使更新
    // 目前发现是通过秒传拿到的文件再生成秒传不会有这问题, 上传的文件或通过分享转存的别人上传的文件则会有
    /*
    rapiduploadCreateFile.call(
      this,
      file,
      (data: any) => {
        data = data.response;
        if (0 === data.errno) this.checkMd5(i + 1); // md5验证成功
        else if (31190 === data.errno) {
          // md5验证失败, 执行普通生成, 仅在此处保存任务进度, 生成页不保存进度
          if (!this.isSharePage)
            GM_setValue("unfinish", {
              file_info_list: this.fileInfoList,
              file_id: i,
              isCheckMd5: true,
            });
          this.isSharePage ? this.getShareDlink(i) : this.getDlink(i);
        } else {
          // 接口访问失败
          file.errno = data.errno;
          this.checkMd5(i + 1);
        }
      },
      (statusCode: number) => {
        file.errno = statusCode;
        this.checkMd5(i + 1);
      },
      0,
      true
    );
    */
  }

  /**
   * @description: 用于解析度盘主页的文件列表数据
   */
  parseMainFileList() {
    for (let item of this.selectList) {
      if (item.isdir) this.dirList.push(item.path);
      else
        this.fileInfoList.push({
          path: item.path,
          size: item.size,
          fs_id: item.fs_id,
          // 已开启极速生成, 直接取meta内的md5
          md5: "",
          md5s: "",
        });
    }
  }

  /**
   * @description: 用于解析分享页的文件列表数据
   */
  parseShareFileList(list = this.selectList) {
    for (let item of list) {
      let path: string;
      if ("app_id" in item)
        path = item.isdir ? item.path : item.server_filename;
      else path = item.path;
      if ("/" !== path.charAt(0)) path = "/" + path; // 补齐路径开头的斜杠
      if (item.isdir) this.dirList.push(path);
      else
        this.fileInfoList.push({
          path: path,
          size: item.size,
          fs_id: item.fs_id,
          md5: item.md5 && decryptMd5(item.md5.toLowerCase()),
          md5s: item.md5s && decryptMd5(item.md5s.toLowerCase()),
        });
    }
  }
}
