/*
 * @Author: mengzonefire
 * @LastEditors: tousakasp
 * @Description: 存放各种全局常量对象
 */

import Swalbase from "@/common/swalBase";
import GeneratebdlinkTask from "./generatebdlinkTask";
import RapiduploadTask from "./rapiduploadTask";

const host = location.host;
export const listLimit = 10000;
export const syncPathPrefix = "/_pcs_.workspace";
export const create_url = `https://${host}/rest/2.0/xpan/file?method=create`; 
export const createdir_url = `https://${host}/api/create?a=commit&clienttype=0&app_id=250528&web=1`; 
export const precreate_url = `https://${host}/api/precreate`;
export const list_url = `https://${host}/rest/2.0/xpan/multimedia?method=listall&order=name&limit=${listLimit}&path=`;
export const meta_url = `https://pcs.baidu.com/rest/2.0/pcs/file?app_id=778750&method=meta&path=`;
export const meta_url2 = `https://${host}/api/filemetas?dlink=1&fsids=`;
export const tpl_url = `https://${host}/share/tplconfig?fields=sign,timestamp&channel=chunlei&web=1&app_id=250528&clienttype=0`;
export const sharedownload_url = `https://${host}/api/sharedownload?channel=chunlei&clienttype=12&web=1&app_id=250528`;
export const sharelist_url = `https://${host}/share/list?showempty=0&num=${listLimit}&channel=chunlei&web=1&app_id=250528&clienttype=0`;
export const syncdownload_url = `https://${host}/api/download`;
export const pcs_url =
  "https://pcs.baidu.com/rest/2.0/pcs/file?app_id=778750&method=download";
export const illegalPathPattern = /[\\":*?<>|]/g; // 匹配路径中的非法字符
export var getBdstoken: () => string; // 获取bdstoken的实现
export function setGetBdstoken(func: () => string) {
  getBdstoken = func;
}
export var getUserId: () => string;
export function setGetUserId(func: () => string) {
  getUserId = func;
}
export var refreshList: () => void; // 刷新文件列表的实现
export function setRefreshList(func: () => void) {
  refreshList = func;
}
export var getSelectedFileList: () => any; // 获取选中的文件列表的实现
export function setGetSelectedFileList(func: () => any) {
  getSelectedFileList = func;
}
export var getShareFileList: () => any;
export function setGetShareFileList(func: () => any) {
  getShareFileList = func;
}
export const swalInstance = new Swalbase(
  new RapiduploadTask(),
  new GeneratebdlinkTask()
);

export function baiduErrno(errno: number) {
  switch (errno) {
    case 31045:
    case -6:
      return "认证失败, 请重新登入, 刷新页面";
    case -7:
      return "转存路径含有非法字符, 请改名后重试";
    case -8:
      return "路径下存在同名文件";
    case -9:
      return "验证已过期, 请刷新页面";
    case 400:
      return "请求错误";
    case 9019:
      return "请重新获取授权码";
    case 20010:
      return "授权应用已被禁用，请更改应用再次授权";
    case 403:
      return "接口限制访问";
    case 404:
    case 31190:
      return "转存失败, 秒传未生效";
    case 114:
      return "转存失败";
    case 514:
      return "请求失败, 常见百度问题, 请稍后重试";
    case 1919:
      return "文件已被和谐";
    case 996:
      return "md5获取失败";
    case 2:
      return "转存失败, 参数错误";
    case -10:
      return "网盘容量已满";
    case 500:
    case 502:
    case 503:
      return "服务器错误, 请稍后重试";
    case 31066:
    case 909:
      return "路径不存在/云端文件已损坏";
    case 900:
      return "路径为文件夹, 不支持生成秒传";
    case 31039:
      return "转存失败, 秒传文件名冲突";
    case 110:
      return "请先登录百度账号";
    case 9013:
      return "账号被限制, 尝试 更换账号 或 等待一段时间再重试";
    default:
      return "不明错误";
  }
} // 自定义百度api返回errno的报错
