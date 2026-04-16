/**
 * 京东养猪猪 自动签到+喂食脚本 (Surge cron)
 * 
 * 功能：
 *   1. 每日签到
 *   2. 自动喂食（消耗饲料）
 *   3. 查询小猪信息
 * 
 * 依赖：需先通过 JDJR_Cookie.js 获取 Cookie
 * 存储 Key：JDJR_COOKIE
 */

const cookieKey = "JDJR_COOKIE";

async function main() {
    const cookie = $persistentStore.read(cookieKey);
    if (!cookie) {
        $notification.post("京东养猪猪", "❌ Cookie 缺失", "请先打开京东金融APP → 养猪猪获取Cookie");
        $done();
        return;
    }

    console.log("=== 京东养猪猪 开始 ===");
    let messages = [];

    // 步骤1：签到
    const signResult = await doSign(cookie);
    messages.push("【签到】" + signResult.message);

    // 步骤2：查询饲料数量
    await delay(1500);
    const foodResult = await getFoodCount(cookie);
    const foodCount = foodResult.foodCount || 0;
    if (foodResult.success) {
        messages.push("【饲料】" + foodResult.message);
    }

    // 步骤3：喂食（有饲料才喂）
    if (foodCount > 0) {
        await delay(1000);
        const feedResult = await doFeed(cookie, Math.min(foodCount, 10));
        messages.push("【喂食】" + feedResult.message);
    } else {
        messages.push("【喂食】暂无饲料，跳过喂食");
    }

    // 步骤4：查询小猪信息
    await delay(1000);
    const infoResult = await getPigInfo(cookie);
    if (infoResult.success) {
        messages.push("【小猪】" + infoResult.message);
    }

    // 汇总通知
    const subtitle = signResult.success ? "✅ 任务完成" : "⚠️ 部分任务异常";
    const body = messages.join("\n");
    $notification.post("京东养猪猪", subtitle, body);

    console.log("=== 京东养猪猪 完成 ===");
    $done();
}

// 养猪猪签到
function doSign(cookie) {
    return new Promise((resolve) => {
        const url = "https://ms.jr.jd.com/gw/generic/h5/m/h5_m_sign/sign";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "JDJR-APP/5.5.0 (iPhone; iOS 16.0; Scale/3.00)",
            "Referer": "https://jdjoy.jd.com/pig/index",
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const body = "source=jrapp&actId=pig_sign";

        $httpClient.post({ url, headers, body }, (error, response, data) => {
            if (error) {
                console.log("签到请求失败: " + error);
                resolve({ success: false, message: "网络请求失败" });
                return;
            }
            try {
                const obj = JSON.parse(data);
                if (obj.resultCode === "0" || obj.code === "0" || obj.success === true) {
                    const msg = obj.resultData?.signMsg || obj.msg || "签到成功，获得饲料";
                    console.log("养猪猪签到: " + msg);
                    resolve({ success: true, message: msg });
                } else {
                    const msg = obj.resultMsg || obj.msg || "今日已签到";
                    console.log("养猪猪签到返回: " + msg);
                    resolve({ success: false, message: msg });
                }
            } catch (e) {
                console.log("签到解析失败: " + e);
                resolve({ success: false, message: "数据解析异常" });
            }
        });
    });
}

// 查询饲料数量
function getFoodCount(cookie) {
    return new Promise((resolve) => {
        const url = "https://ms.jr.jd.com/gw/generic/h5/m/h5_m_index/myFood";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "JDJR-APP/5.5.0 (iPhone; iOS 16.0; Scale/3.00)",
            "Referer": "https://jdjoy.jd.com/pig/index"
        };

        $httpClient.get({ url, headers }, (error, response, data) => {
            if (error) {
                resolve({ success: false, foodCount: 0, message: "查询饲料失败" });
                return;
            }
            try {
                const obj = JSON.parse(data);
                const foodCount = obj.resultData?.foodNum || obj.data?.foodNum || 0;
                console.log("当前饲料数量: " + foodCount);
                resolve({ success: true, foodCount: foodCount, message: `剩余 ${foodCount} 份饲料` });
            } catch (e) {
                resolve({ success: false, foodCount: 0, message: "饲料数据解析异常" });
            }
        });
    });
}

// 喂食
function doFeed(cookie, count) {
    return new Promise((resolve) => {
        const url = "https://ms.jr.jd.com/gw/generic/h5/m/h5_m_food/feed";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "JDJR-APP/5.5.0 (iPhone; iOS 16.0; Scale/3.00)",
            "Referer": "https://jdjoy.jd.com/pig/index",
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const body = `source=jrapp&feedCount=${count}`;

        $httpClient.post({ url, headers, body }, (error, response, data) => {
            if (error) {
                console.log("喂食请求失败: " + error);
                resolve({ success: false, message: "网络请求失败" });
                return;
            }
            try {
                const obj = JSON.parse(data);
                if (obj.resultCode === "0" || obj.code === "0") {
                    const msg = obj.resultData?.feedMsg || obj.msg || `成功喂食 ${count} 次`;
                    console.log("养猪猪喂食: " + msg);
                    resolve({ success: true, message: msg });
                } else {
                    const msg = obj.resultMsg || obj.msg || "喂食失败";
                    console.log("养猪猪喂食返回: " + msg);
                    resolve({ success: false, message: msg });
                }
            } catch (e) {
                console.log("喂食解析失败: " + e);
                resolve({ success: false, message: "数据解析异常" });
            }
        });
    });
}

// 查询小猪信息
function getPigInfo(cookie) {
    return new Promise((resolve) => {
        const url = "https://ms.jr.jd.com/gw/generic/h5/m/h5_m_index/myPetInfo";
        const headers = {
            "Cookie": cookie,
            "User-Agent": "JDJR-APP/5.5.0 (iPhone; iOS 16.0; Scale/3.00)",
            "Referer": "https://jdjoy.jd.com/pig/index"
        };

        $httpClient.get({ url, headers }, (error, response, data) => {
            if (error) {
                resolve({ success: false, message: "" });
                return;
            }
            try {
                const obj = JSON.parse(data);
                const petInfo = obj.resultData?.petInfo || obj.data?.petInfo || {};
                const level = petInfo.petLevel || petInfo.level || "未知";
                const weight = petInfo.petWeight || petInfo.weight || "未知";
                const msg = `等级Lv.${level} · 体重${weight}`;
                console.log("小猪信息: " + msg);
                resolve({ success: true, message: msg });
            } catch (e) {
                resolve({ success: false, message: "" });
            }
        });
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main();
