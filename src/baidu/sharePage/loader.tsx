/*
 * @Author: mengzonefire
 * @LastEditors: tousakasp
 * @Description: 文件分享页loader入口: https://pan.baidu.com/s/xxx
 */

import { TAG, version, enableDirectDownload } from "@/common/const";
import { setGetBdstoken, setGetUserId, setGetShareFileList, swalInstance } from "../common/const";
import { getShareFileList } from "@/common/utils";

const htmlBtnGenShare = // 分享页的秒传生成按钮html元素
  '<a id="gen_bdlink_btn_sharePage" title="生成秒传" class="g-button g-button-blue-large" style="margin-right: 5px;margin-left: 5px;"> <span class="g-button-right"> <em class="icon icon-share" style="color:#ffffff" title="生成秒传"></em> <span class="text" style="width: auto;">生成秒传</span> </span> </a>';
const htmlBtnDownload = // 分享页的秒传生成按钮html元素
  '<a id="dl_file_btn_sharePage" title="直接下载" class="g-button" style="margin-right: 5px;margin-left: 5px;border-color:#dfafaf"> <span class="g-button-right"><em class="icon icon-download" style="color:#DB3710" title="直接下载"></em></span> </a>';
const htmlTagSahre = "[node-type=qrCode]";

export default function installShare() {
  console.info("%s version: %s DOM方式安装", TAG, version);
  setGetBdstoken(() => unsafeWindow.locals.get("bdstoken"));
  setGetUserId(() => unsafeWindow.locals.get("uk"));
  setGetShareFileList(getShareFileList);
  addBtn();
  $(document).on("click", "#gen_bdlink_btn_sharePage", () => {
    swalInstance.generatebdlinkTask.reset();
    swalInstance.generatebdlinkTask.isSharePage = true;
    swalInstance.genFileWork(false, false);
  }); // 绑定生成按钮事件
  $(document).on("click", "#dl_file_btn_sharePage", () => {
    swalInstance.generatebdlinkTask.reset();
    swalInstance.generatebdlinkTask.isSharePage = true;
    swalInstance.generatebdlinkTask.isDownload = true;
    swalInstance.genFileWork(false, false);
  }); // 绑定生成按钮事件
}

function addBtn() {
  if ($(htmlTagSahre).length) {
    $(htmlTagSahre).before(htmlBtnGenShare);
    if (enableDirectDownload) {
      $(htmlTagSahre).before(htmlBtnDownload);
    }
  }
  else setTimeout(addBtn, 100);
}
