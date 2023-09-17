/*
 * @Author: mengzonefire
 * @LastEditors: tousakasp
 * @Description: 存放各种全局常量对象
 */

export const version = "3.1.8.1"; // 当前版本号
export const updateDate = "23.9.16"; // 更新弹窗显示的日期
export const updateInfoVer = "3.1.8"; // 更新弹窗的版本, 没必要提示的非功能性更新就不弹窗了
export const swalCssVer = "3.1.6"; // 由于其他主题的Css代码会缓存到本地, 故更新主题包版本(url)时, 需要同时更新该字段以刷新缓存
export const locUrl: string = location.href;
export const baiduMobilePage = "baidu.com/wap/home";
export const baiduNewPage = "baidu.com/disk/main"; // 匹配新版度盘界面
export const baiduSyncPage = "baidu.com/disk/synchronization"; // 匹配同步空间
export const baiduSharePage = "baidu.com/s/"; // 匹配分享页
export const TAG = "[秒传转存助手 mod by tousakasp]";
export const ajaxError = 514; // 自定义ajax请求失败时的错误码(不能与http statusCode冲突)
export const bdlinkPrefix = "https://pan.baidu.com/#bdlink="; // 一键秒传链接的前缀
export const commandList = ["set", "gen", "info"]; // 转存输入框内支持输入的命令
export const UA = "netdisk;"; // 自定义User-Agent
export const extCssUrl = {
  Default: "https://unpkg.com/@sweetalert2/theme-default@5.0.15/default.min.css",
  Dark: "https://unpkg.com/@sweetalert2/theme-dark@5.0.15/dark.min.css",
  "WordPress Admin":
    "https://unpkg.com/@sweetalert2/theme-wordpress-admin@5.0.15/wordpress-admin.min.css",
  "Material UI":
    "https://unpkg.com/@sweetalert2/theme-material-ui@5.0.15/material-ui.min.css",
  Bulma:
    "https://unpkg.com/@sweetalert2/theme-bulma@5.0.15/bulma.min.css",
  "Bootstrap 4":
    "https://unpkg.com/@sweetalert2/theme-bootstrap-4@5.0.15/bootstrap-4.min.css",
}; // 各主题包对应的url
export const appError = {
  SwalCssInvalid: `样式包数据错误, 自动使用内置样式 (请点确定)`,
  SwalCssErrReq: `样式包加载失败, 自动使用内置样式 (请点确定), 错误代码: `,
  ClipboardPremissionErr:
    '使用 "监听剪贴板" 功能需要允许剪贴板权限!\n该功能只支持Chrome系/Edge/Opera浏览器, 不支持Firefox, 同时注意使用https访问页面 (http访问会导致浏览器直接禁止剪贴板权限)',
}; // 主程序异常
export const enum genTryflag {
  useDlink1 = 0,
  useDlink2 = 1,
} // 秒传生成 标识参数
const docPrefix2 =
  "https://xtsat.github.io/rapid-upload-userscript-doc/document";
export const doc2 = {
  shareDoc: `${docPrefix2}/FAQ/错误代码`,
  linkTypeDoc: `${docPrefix2}/Info/秒传格式`,
  bdlinkDoc: `${docPrefix2}/秒传链接生成/一键秒传`,
}; // 文档载点2
export const linkStyle =
  'class="mzf_link" rel="noopener noreferrer" target="_blank"';
export const btnStyle =
  'class="mzf_btn" rel="noopener noreferrer" target="_blank"';
export const bdlinkPattern = /#bdlink=([\da-zA-Z+/=]+)/; // b64可能出现的字符: 大小写字母a-zA-Z, 数字0-9, +, /, = (=用于末尾补位)
// export const htmlDocument = `<p class="mzf_text">秒传无效</p>`;
// export const htmlAboutBdlink = `什么是一键秒传?: <a href="${doc2.bdlinkDoc}" ${linkStyle}>文档载点</a>`;
export const copyFailList =
  '<a id="copy_fail_list" class="mzf_btn2">复制列表</a>';
export const copyFailBranchList =
  '<a id="copy_fail_branch_list" class="mzf_btn2">复制列表</a>';
export const copySuccessList =
  '<a id="copy_success_list" class="mzf_btn2">复制列表</a>';
