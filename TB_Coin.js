/**
 * 淘宝淘金币 自动签到+领金币脚本 (Surge cron)
 * 
 * 功能：
 *   1. 每日签到
 *   2. 自动领取待领取的金币
 *   3. 查询金币余额
 * 
 * 依赖：需先通过 TB_Cookie.js 获取 Cookie
 * 存储 Key：TB_COOKIE
 */

const cookieKey = "TB_COOKIE";

async function main() {
    const cookie = $persistentStore.read(cookieKey);
    if (!cookie) {
        $notification.post("淘宝淘金币", "❌ Cookie 缺失", "请先打开淘宝APP → 淘金币页面获取Cookie");
        $done();
        return;
    }

    console.log("=== 淘宝淘金币 开始 ===");
    let messages = [];

    // 步骤1：每日签到
    const signResult = await doSign(cookie);
    messages.push("【签到】" + signResult.message);

    // 步骤2：领取待领金币（浏览任务奖励等）
    await delay(2000);
    const collectResult = await collectCoins(cookie);
    if (collectResult.success) {
        messages.push("【领金币】" + collectResult.message);
    }

    // 步骤3：查询金币余额
    await delay(1000);
    const balanceResult = await getCoinBalance(cookie);
    if (balanceResult.success) {
        messages.push("【余额】" + balanceResult.message);
    }

    // 汇总通知
    const subtitle = signResult.success ? "✅ 任务完成" : "⚠️ 部分任务异常";
    const body = messages.join("\n");
    $notification.post("淘宝淘金币", subtitle, body);

    console.log("=== 淘宝淘金币 完成 ===");
    $done();
}

// 淘金币每日签到
function doSign(cookie) {
    return new Promise((resolve) => {
        const url = "https://h5api.m.taobao.com/h5/mtop.alimama.union.mtopad.common.coupon.page.get/1.2/";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
            "Referer": "https://pages.tmall.com/wow/a/act/dailycoin",
            "Content-Type": "application/x-www-form-urlencoded"
        };

        // 淘金币签到接口
        const signUrl = "https://h5api.m.taobao.com/h5/mtop.taobao.coin.signedin/1.0/";
        const params = "jsv=2.7.2&appKey=12574478&t=" + Date.now() + "&sign=ff&api=mtop.taobao.coin.signedin&v=1.0&type=originaljson&dataType=json";

        $httpClient.post({ url: signUrl, headers, body: params }, (error, response, data) => {
            if (error) {
                console.log("签到请求失败: " + error);
                resolve({ success: false, message: "网络请求失败" });
                return;
            }
            try {
                const obj = JSON.parse(data);
                if (obj.ret && obj.ret[0] === "SUCCESS::调用成功" && obj.data) {
                    const result = obj.data.result || {};
                    const msg = result.success ? `签到成功，获得 ${result.coinNum || ""} 金币` : (result.message || "签到成功");
                    console.log("淘金币签到: " + msg);
                    resolve({ success: true, message: msg });
                } else {
                    const errMsg = obj.ret ? obj.ret[0] : "签到接口返回异常";
                    // 判断是否已签到
                    if (errMsg.includes("已签到") || errMsg.includes("已经")) {
                        console.log("淘金币签到: 今日已签到");
                        resolve({ success: true, message: "今日已签到" });
                    } else {
                        console.log("淘金币签到返回: " + errMsg);
                        resolve({ success: false, message: errMsg });
                    }
                }
            } catch (e) {
                console.log("签到解析失败: " + e);
                resolve({ success: false, message: "数据解析异常" });
            }
        });
    });
}

// 领取待领金币
function collectCoins(cookie) {
    return new Promise((resolve) => {
        const url = "https://h5api.m.taobao.com/h5/mtop.taobao.coin.acquire/1.0/";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
            "Referer": "https://pages.tmall.com/wow/a/act/dailycoin",
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const body = "jsv=2.7.2&appKey=12574478&t=" + Date.now() + "&api=mtop.taobao.coin.acquire&v=1.0&type=originaljson&dataType=json";

        $httpClient.post({ url, headers, body }, (error, response, data) => {
            if (error) {
                resolve({ success: false, message: "领取失败" });
                return;
            }
            try {
                const obj = JSON.parse(data);
                if (obj.ret && obj.ret[0] === "SUCCESS::调用成功" && obj.data) {
                    const result = obj.data.result || {};
                    const coins = result.coinNum || "0";
                    const msg = result.success ? `成功领取 ${coins} 金币` : (result.message || "暂无可领金币");
                    console.log("领金币: " + msg);
                    resolve({ success: true, message: msg });
                } else {
                    resolve({ success: false, message: "暂无可领金币" });
                }
            } catch (e) {
                resolve({ success: false, message: "数据解析异常" });
            }
        });
    });
}

// 查询金币余额
function getCoinBalance(cookie) {
    return new Promise((resolve) => {
        const url = "https://h5api.m.taobao.com/h5/mtop.taobao.coin.home/1.0/";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
            "Referer": "https://pages.tmall.com/wow/a/act/dailycoin",
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const body = "jsv=2.7.2&appKey=12574478&t=" + Date.now() + "&api=mtop.taobao.coin.home&v=1.0&type=originaljson&dataType=json";

        $httpClient.post({ url, headers, body }, (error, response, data) => {
            if (error) {
                resolve({ success: false, message: "查询余额失败" });
                return;
            }
            try {
                const obj = JSON.parse(data);
                if (obj.ret && obj.ret[0] === "SUCCESS::调用成功" && obj.data) {
                    const result = obj.data.result || {};
                    const balance = result.coinAmount || result.totalCoin || "未知";
                    console.log("金币余额: " + balance);
                    resolve({ success: true, message: `当前金币余额：${balance}` });
                } else {
                    resolve({ success: false, message: "余额查询异常" });
                }
            } catch (e) {
                resolve({ success: false, message: "数据解析异常" });
            }
        });
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main();
