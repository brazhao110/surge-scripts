/**
 * 京东 Cookie 获取脚本 (Surge http-request)
 * 触发条件：访问 bean.m.jd.com
 * 存储 Key：JD_COOKIE
 */

const cookieKey = "JD_COOKIE";

function getCookieFromRequest() {
    let cookie = $request.headers["Cookie"] || $request.headers["cookie"] || "";
    if (!cookie && $request.url) {
        cookie = $request.url.match(/cookie=([^&]+)/) ? decodeURIComponent($request.url.match(/cookie=([^&]+)/)[1]) : "";
    }
    return cookie;
}

function saveCookie(rawCookie) {
    if (!rawCookie || rawCookie.length < 10) {
        $notification.post("京东签到", "❌ Cookie 为空", "未检测到登录信息");
        return false;
    }

    const ptKeyMatch = rawCookie.match(/pt_key=[^;]+/);
    const ptPinMatch = rawCookie.match(/pt_pin=[^;]+/);

    if (ptKeyMatch && ptPinMatch) {
        const usefulCookie = ptKeyMatch[0] + "; " + ptPinMatch[0];
        $persistentStore.write(usefulCookie, cookieKey);
        $notification.post("京东签到", "✅ Cookie 获取成功", "pt_pin: " + ptPinMatch[0].split("=")[1]);
        return true;
    } else if (rawCookie.includes("pt_key") || rawCookie.includes("pt_pin")) {
        $persistentStore.write(rawCookie, cookieKey);
        $notification.post("京东签到", "✅ Cookie 获取成功", "Cookie 已保存");
        return true;
    } else {
        $notification.post("京东签到", "⚠️ 未检测到 pt_key", "Cookie: " + rawCookie.substring(0, 50) + "...");
        return false;
    }
}

const cookie = getCookieFromRequest();
if (saveCookie(cookie)) {
    console.log("京东 Cookie 已保存");
} else {
    console.log("京东 Cookie 获取失败");
}

$done({});
