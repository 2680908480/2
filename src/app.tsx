import { injectStyle } from "./common/injectStyle";
import { Base64 } from 'js-base64';

/**
 * @description: 主函数入口
 */
function app(): void {
  Base64.extendString();
  injectStyle();
}

function acquireAccessToken() : void {
  if (document.location.pathname === "/oauth/2.0/login_success") {
    const request : string = GM_getValue("accessTokenRequest");
    if (request.startsWith("request:")) {
      const requestId = request.substring(8);
      const match = document.location.hash.match(/&access_token=([^ =&]+)&/);
      if (match) {
        if (confirm("检测到授权码，是否采用？ (也可以手动复制此窗口url粘贴至授权码输入栏)")) {
          GM_setValue("accessTokenRequest", `accessToken:${requestId}:${match[1]}`);
          //console.info("access-token = " + match[1]);
        }
      }
    }
  }
}

// 广告拦截插件会导致脚本报错跳出, 网页卡死, 故加入异常处理
try {
  if (document.location.host === "openapi.baidu.com") {
    acquireAccessToken();
  } else {
    app();
  }
} catch (error) {
  console.log(error);
}
