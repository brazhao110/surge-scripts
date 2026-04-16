/**
 * 京东 Cookie 获取脚本 (Surge http-request)
 * 
 * 触发条件：访问 https://bean.m.jd.com 或京东签到页面
 * 自动捕获并保存 Cookie 到 Surge 持久化存储
 * 
 * 存储 Key：JD_COOKIE
 * 存储 Value：京东 pt_key + pt_pin
 */

const cookieKey = "JD_COOKIE";

// 尝试从请求头或响应中提取 Cookie
function getCookieFromRequest() {
    let cookie = $request.headers["Cookie"] || $request.headers["cookie"] || "";
    return cookie;
}

function saveCookie(rawCookie) {
    if (!rawCookie || rawCookie.length < 10) {
        return false;
    }

    // 提取 pt_key 和 pt_pin（京东核心认证字段）
    const ptKeyMatch = rawCookie.match(/pt_key=[^;]+/);
    const ptPinMatch = rawCookie.match(/pt_pin=[^;]+/);

    if (ptKeyMatch && ptPinMatch) {
        const usefulCookie = ptKeyMatch[0] + "; " + ptPinMatch[0];
        $persistentStore.write(usefulCookie, cookieKey);
        console.log("京东 Cookie 保存成功");
        $notification.post("京东签到", "✅ Cookie 获取成功", "pt_pin: " + ptPinMatch[0].split("=")[1]);
        return true;
    } else if (rawCookie.includes("pt_key") || rawCookie.includes("pt_pin")) {
        // 直接保存完整 cookie（可能格式不同）
        $persistentStore.write(rawCookie, cookieKey);
        console.log("京东 Cookie 保存成功（完整）");
        $notification.post("京东签到", "✅ Cookie 获取成功", "Cookie 已保存");
        return true;
    } else {
        console.log("未找到有效的京东认证字段");
        return false;
    }
}

// 执行
const cookie = getCookieFromRequest();
if (saveCookie(cookie)) {
    console.log("京东 Cookie 已保存，定时签到任务将使用此 Cookie");
} else {
    console.log("京东 Cookie 获取失败，请确保已登录京东APP或网页");
}

$done({});
