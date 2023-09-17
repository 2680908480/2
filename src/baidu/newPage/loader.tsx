/*
 * @Author: mengzonefire
 * @LastEditors: tousakasp
 * @Description: 新版度盘界面loader入口: https://pan.baidu.com/disk/main
 */

import { TAG, version } from "@/common/const";
import {
  setGetBdstoken,
  setGetUserId,
  setGetShareFileList,
  setGetSelectedFileList,
  setRefreshList,
  swalInstance,
} from "../common/const";
import { getSelectedFileListNew, getShareFileList } from "@/common/utils";

const htmlTagNew = "div.nd-file-list-toolbar__actions"; // 新版界面秒传按钮的html父对象
const htmlTagNew2 = "div.wp-s-agile-tool-bar__header"; // 22.5.24: 新版界面新增的一个父对象
const htmlBtnRapidNew = // 新版界面秒传按钮的html元素
  '<button id="bdlink_btn" class="mzf_new_btn"></i><span>秒传</span></button>';
const htmlBtnGenNew = // 新版界面秒传生成按钮的html元素
  '<button id="gen_bdlink_btn" class="mzf_new_btn"></i><span>生成秒传</span></button>';
const htmlBtnDownload =
  '<button id="dl_file_btn" class="mzf_new_btn mzf_new_btn_icon_only mzf_new_btn_red" title="直接下载"></i><span class="u-icon-download"></span></button>';

export default function installNew() {
  console.info("%s version: %s DOM方式安装 (new-ui)", TAG, version);
  swalInstance.swalGlobalArgs = {
    heightAuto: false,
    scrollbarPadding: false,
  }; // 添加swal参数以防止新版界面下的body样式突变
  setRefreshList(() => {
    document
      .querySelector(".nd-main-list, .nd-new-main-list")
      .__vue__.reloadList();
  });
  setGetShareFileList(getShareFileList);
  setGetSelectedFileList(getSelectedFileListNew);
  setGetBdstoken(
    () =>
      document.querySelector(".nd-main-list, .nd-new-main-list").__vue__.yunData
        .bdstoken
  );
  setGetUserId(() => '' + document.querySelector(".nd-main-list, .nd-new-main-list").__vue__.yunData.uk);
  $(document).on("click", "#bdlink_btn", () => {
    swalInstance.inputView();
  }); // 绑定转存秒传按钮事件
  $(document).on("click", "#gen_bdlink_btn", () => {
    swalInstance.generatebdlinkTask.reset();
    swalInstance.checkUnfinish();
  }); // 绑定生成秒传按钮事件
  $(document).on("click", "#dl_file_btn", () => {
    swalInstance.generatebdlinkTask.reset();
    swalInstance.generatebdlinkTask.isDownload = true;
    swalInstance.checkUnfinish();
  });
  addBtn();
}

function addBtn() {
  // 轮询添加按钮, 防止新版页面重复init时, 将按钮覆盖
  let target = $(htmlTagNew);
  if (!target.length) target = $(htmlTagNew2);
  if (target.length && !$("#bdlink_btn").length)
    target.append(htmlBtnRapidNew, htmlBtnGenNew, htmlBtnDownload);
  setTimeout(addBtn, 500);
}
