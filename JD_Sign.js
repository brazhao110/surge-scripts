/**
 * 京东每日自动签到脚本 (Surge cron)
 * 
 * 功能：京东APP每日签到领京豆
 * 依赖：需先通过 JD_Cookie.js 获取 Cookie (pt_key + pt_pin)
 * 存储 Key：JD_COOKIE
 */

const cookieKey = "JD_COOKIE";

async function main() {
    const cookie = $persistentStore.read(cookieKey);
    if (!cookie) {
        $notification.post("京东签到", "❌ Cookie 缺失", "请先打开京东APP获取Cookie");
        $done();
        return;
    }

    // 检查 pt_key
    if (!cookie.includes("pt_key") || !cookie.includes("pt_pin")) {
        $notification.post("京东签到", "⚠️ Cookie 不完整", "Cookie 需包含 pt_key 和 pt_pin，请重新获取");
        $done();
        return;
    }

    console.log("=== 京东每日签到开始 ===");

    // 签到
    const signResult = await doSign(cookie);
    // 查询京豆余额
    const beanResult = await getBeanInfo(cookie);

    let subtitle = signResult.success ? "✅ 签到成功" : "❌ 签到失败";
    let body = signResult.message;
    if (beanResult.success) {
        body += "\n京豆余额：" + beanResult.beans;
    }
    $notification.post("京东签到", subtitle, body);

    console.log("=== 京东每日签到完成 ===");
    $done();
}

function doSign(cookie) {
    return new Promise((resolve) => {
        const url = "https://api.m.jd.com/client.action";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "jdapp;iPhone;10.0.0;14.0;network/wifi;Mozilla/5.0",
            "Referer": "https://bean.m.jd.com/bean/signIndex.action",
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const body = "functionId=signBeanIndex&appid=ld";

        $httpClient.post({ url, headers, body }, (error, response, data) => {
            if (error) {
                console.log("签到请求失败: " + error);
                resolve({ success: false, message: "网络错误: " + error });
                return;
            }
            try {
                console.log("签到原始返回: " + data);
                const obj = JSON.parse(data);
                if (obj.code === "0" || obj.success === true) {
                    const signInfo = obj.data?.signResult || obj.data || {};
                    const msg = signInfo.rewardMsg || signInfo.continueSignDay
                        ? "连续签到" + signInfo.continueSignDay + "天，" + (signInfo.rewardMsg || "京豆已到账")
                        : "签到成功，京豆已到账";
                    resolve({ success: true, message: msg });
                } else if (obj.code === "3" || obj.errorMessage?.includes("已签到")) {
                    resolve({ success: true, message: "今日已签到" });
                } else {
                    const errMsg = obj.errorMessage || obj.msg || JSON.stringify(obj);
                    resolve({ success: false, message: errMsg });
                }
            } catch (e) {
                console.log("签到解析失败: " + e + " | 原始数据: " + data);
                resolve({ success: false, message: "返回数据异常: " + data.substring(0, 100) });
            }
        });
    });
}

function getBeanInfo(cookie) {
    return new Promise((resolve) => {
        const url = "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion?sceneval=2&g_login_type=1";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "jdapp;iPhone;10.0.0;14.0;network/wifi;Mozilla/5.0",
            "Referer": "https://home.m.jd.com/myJd/newhome.action"
        };

        $httpClient.get({ url, headers }, (error, response, data) => {
            if (error) {
                resolve({ success: false, beans: "查询失败" });
                return;
            }
            try {
                const obj = JSON.parse(data);
                if (obj.retcode === 0 && obj.data) {
                    const nick = obj.data?.base?.nickname || "";
                    const bean = obj.data?.assetInfo?.beanNum || "未知";
                    resolve({ success: true, beans: (nick ? nick + " " : "") + bean + "豆" });
                } else {
                    resolve({ success: false, beans: "未知" });
                }
            } catch (e) {
                resolve({ success: false, beans: "未知" });
            }
        });
    });
}

main();
