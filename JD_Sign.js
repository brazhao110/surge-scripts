/**
 * 京东每日自动签到脚本 (Surge cron)
 * 
 * 功能：京东APP每日签到领京豆
 * 
 * 依赖：需先通过 JD_Cookie.js 获取 Cookie
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

    console.log("=== 京东每日签到开始 ===");

    // 步骤1：签到
    const signResult = await doSign(cookie);
    // 步骤2：查询京豆余额
    const beanResult = await getBeanInfo(cookie);

    // 汇总通知
    let subtitle = signResult.success ? "✅ 签到成功" : "❌ 签到失败";
    let body = signResult.message;
    if (beanResult.success) {
        body += `\n当前京豆余额：${beanResult.beans}`;
    }
    $notification.post("京东签到", subtitle, body);

    console.log("=== 京东每日签到完成 ===");
    $done();
}

// 京东签到接口
function doSign(cookie) {
    return new Promise((resolve) => {
        const url = "https://api.m.jd.com/client.action?functionId=signBeanIndex&pageFrom=bean";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "JD4iPhone/169000 (iPhone; iOS 16.0; Scale/3.00)",
            "Referer": "https://bean.m.jd.com/bean/signIndex.action"
        };

        $httpClient.get({ url, headers }, (error, response, data) => {
            if (error) {
                console.log("签到请求失败: " + error);
                resolve({ success: false, message: "网络请求失败: " + error });
                return;
            }
            try {
                const obj = JSON.parse(data);
                if (obj.code === "0" || obj.success) {
                    const signInfo = obj.data?.signResult || {};
                    const msg = signInfo.rewardMsg || "签到成功，京豆已到账";
                    console.log("签到成功: " + msg);
                    resolve({ success: true, message: msg });
                } else {
                    const errMsg = obj.errorMessage || "签到失败";
                    console.log("签到接口返回: " + errMsg);
                    resolve({ success: false, message: errMsg });
                }
            } catch (e) {
                console.log("签到结果解析失败: " + e);
                resolve({ success: false, message: "数据解析异常" });
            }
        });
    });
}

// 查询京豆余额
function getBeanInfo(cookie) {
    return new Promise((resolve) => {
        const url = "https://wq.jd.com/user_new/info/GetJDUserInfoUnion?sceneval=2";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "JD4iPhone/169000 (iPhone; iOS 16.0; Scale/3.00)",
            "Referer": "https://bean.m.jd.com/"
        };

        $httpClient.get({ url, headers }, (error, response, data) => {
            if (error) {
                resolve({ success: false, beans: "未知" });
                return;
            }
            try {
                const obj = JSON.parse(data);
                const beans = obj.retcode === 0 ? (obj.data?.jingBean || obj.jdBean || "0") : "未知";
                resolve({ success: true, beans: beans });
            } catch (e) {
                // 尝试从原始数据中提取
                const match = data.match(/\"jingBean\":\"?(\d+)"?/);
                const beans = match ? match[1] : "未知";
                resolve({ success: true, beans: beans });
            }
        });
    });
}

main();
