/*
 * @Author: mengzonefire
 * @Date: 2021-08-27 14:48:24
 * @LastEditTime: 2023-02-14 04:10:09
 * @LastEditTime: 2023-09-16
 * @LastEditors: mengzonefire
 * @LastEditors: tousakasp
 * @Description: 自封装JQ ajax方法
 */

import { ajaxError, TAG, version } from "./const";

const DEBUG = false;

export default function ajax(
  config: any,
  callback: (response: any) => void,
  failback: (statusCode: number) => void,
  retry: {
    max: number,
    delay: number,
    accepts: (statusCode: number, response: any) => boolean
  } = {
    max: 0,
    delay: 0,
    accepts: () => true
  },
) {
  function execute(retryLeft: number) {
    GM_xmlhttpRequest({
      ...config,
      onload: (r: any) => {
        // console.log(r); // debug
        if (Math.floor(r.status / 100) === 2) {
          if (DEBUG) {
            console.info(
              "%s version: %s 接口返回: %s",
              TAG,
              version,
              JSON.stringify(r.response)
            ); // user debug
          }
          if (retryLeft <= 0 || retry.accepts(r.status, r.response)) {
            callback(r);
          } else {
            scheduleRetry();
          }
        } else {
          if (retryLeft <= 0 || retry.accepts(r.status, null)) {
            failback(r.status);
          } else {
            scheduleRetry();
          }
        }
      },
      onerror: () => {
        if (retryLeft <= 0 || retry.accepts(ajaxError, null)) {
          failback(ajaxError);
        } else {
          scheduleRetry();
        }
      },
    });

    function scheduleRetry() {
      console.info(`重试 ${config.url}`);
      setTimeout(() => execute(retryLeft - 1), retry.delay);
    }
  }
  execute(retry.max);
}
