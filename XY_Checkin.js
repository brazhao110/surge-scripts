/**
 * 闲鱼 自动签到+得骰子脚本 (Surge cron)
 * 
 * 功能：
 *   1. 每日签到
 *   2. 自动摇骰子/得骰子
 *   3. 查询积分信息
 * 
 * 依赖：需先通过 XY_Cookie.js 获取 Cookie
 * 存储 Key：XY_COOKIE
 */

const cookieKey = "XY_COOKIE";

async function main() {
    const cookie = $persistentStore.read(cookieKey);
    if (!cookie) {
        $notification.post("闲鱼签到", "❌ Cookie 缺失", "请先打开闲鱼APP → 我的页面获取Cookie");
        $done();
        return;
    }

    console.log("=== 闲鱼签到 开始 ===");
    let messages = [];

    // 步骤1：每日签到
    const signResult = await doSign(cookie);
    messages.push("【签到】" + signResult.message);

    // 步骤2：得骰子/摇骰子
    await delay(2000);
    const diceResult = await getDice(cookie);
    if (diceResult.success) {
        messages.push("【得骰子】" + diceResult.message);
    }

    // 步骤3：查询闲鱼积分/金币
    await delay(1000);
    const pointsResult = await getPoints(cookie);
    if (pointsResult.success) {
        messages.push("【积分】" + pointsResult.message);
    }

    // 汇总通知
    const subtitle = signResult.success ? "✅ 任务完成" : "⚠️ 部分任务异常";
    const body = messages.join("\n");
    $notification.post("闲鱼签到", subtitle, body);

    console.log("=== 闲鱼签到 完成 ===");
    $done();
}

// 闲鱼每日签到
function doSign(cookie) {
    return new Promise((resolve) => {
        const url = "https://h5api.m.taobao.com/h5/mtop.taobao.idlefish.user.sign/1.0/";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148%20AliApp(IDLEFISH/8.3.40)",
            "Referer": "https://market.m.taobao.com/app/idleFish-F2e/fish-pond/index.html",
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const body = "jsv=2.7.2&appKey=12574478&t=" + Date.now() + "&api=mtop.taobao.idlefish.user.sign&v=1.0&type=originaljson&dataType=json";

        $httpClient.post({ url, headers, body }, (error, response, data) => {
            if (error) {
                console.log("签到请求失败: " + error);
                resolve({ success: false, message: "网络请求失败" });
                return;
            }
            try {
                const obj = JSON.parse(data);
                if (obj.ret && obj.ret[0] === "SUCCESS::调用成功" && obj.data) {
                    const result = obj.data.result || {};
                    const msg = result.success ? "签到成功" : (result.message || "今日已签到");
                    console.log("闲鱼签到: " + msg);
                    resolve({ success: true, message: msg });
                } else {
                    const errMsg = obj.ret ? obj.ret[0] : "签到接口返回异常";
                    if (errMsg.includes("已签到") || errMsg.includes("已经")) {
                        console.log("闲鱼签到: 今日已签到");
                        resolve({ success: true, message: "今日已签到" });
                    } else {
                        console.log("闲鱼签到返回: " + errMsg);
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

// 得骰子/摇骰子
function getDice(cookie) {
    return new Promise((resolve) => {
        const url = "https://h5api.m.taobao.com/h5/mtop.taobao.idlefish.fishpond.game.throw.dice/1.0/";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148%20AliApp(IDLEFISH/8.3.40)",
            "Referer": "https://market.m.taobao.com/app/idleFish-F2e/fish-pond/index.html",
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const body = "jsv=2.7.2&appKey=12574478&t=" + Date.now() + "&api=mtop.taobao.idlefish.fishpond.game.throw.dice&v=1.0&type=originaljson&dataType=json";

        $httpClient.post({ url, headers, body }, (error, response, data) => {
            if (error) {
                resolve({ success: false, message: "摇骰子失败" });
                return;
            }
            try {
                const obj = JSON.parse(data);
                if (obj.ret && obj.ret[0] === "SUCCESS::调用成功" && obj.data) {
                    const result = obj.data.result || {};
                    const diceValue = result.diceValue || result.point || "?";
                    const msg = result.success ? `摇到了 ${diceValue} 点` : (result.message || "骰子已使用");
                    console.log("闲鱼摇骰子: " + msg);
                    resolve({ success: true, message: msg });
                } else {
                    const errMsg = obj.ret ? obj.ret[0] : "";
                    if (errMsg.includes("已使用") || errMsg.includes("已经")) {
                        resolve({ success: false, message: "今日骰子已使用" });
                    } else {
                        resolve({ success: false, message: "暂无可用骰子" });
                    }
                }
            } catch (e) {
                resolve({ success: false, message: "数据解析异常" });
            }
        });
    });
}

// 查询积分/金币
function getPoints(cookie) {
    return new Promise((resolve) => {
        const url = "https://h5api.m.taobao.com/h5/mtop.taobao.idlefish.user.asset.query/1.0/";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148%20AliApp(IDLEFISH/8.3.40)",
            "Referer": "https://market.m.taobao.com/app/idleFish-F2e/fish-pond/index.html",
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const body = "jsv=2.7.2&appKey=12574478&t=" + Date.now() + "&api=mtop.taobao.idlefish.user.asset.query&v=1.0&type=originaljson&dataType=json";

        $httpClient.post({ url, headers, body }, (error, response, data) => {
            if (error) {
                resolve({ success: false, message: "查询积分失败" });
                return;
            }
            try {
                const obj = JSON.parse(data);
                if (obj.ret && obj.ret[0] === "SUCCESS::调用成功" && obj.data) {
                    const result = obj.data.result || {};
                    const points = result.point || result.coin || result.totalPoint || "未知";
                    console.log("闲鱼积分: " + points);
                    resolve({ success: true, message: `当前积分：${points}` });
                } else {
                    resolve({ success: false, message: "积分查询异常" });
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
