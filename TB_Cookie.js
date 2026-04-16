/**
 * 淘宝 Cookie 获取脚本 (Surge http-request)
 * 
 * 触发条件：访问淘宝 APP 淘金币页面
 * 自动捕获并保存 Cookie 到 Surge 持久化存储
 * 
 * 存储 Key：TB_COOKIE
 * 存储 Value：淘宝 Cookie
 */

const cookieKey = "TB_COOKIE";

function getCookieFromRequest() {
    let cookie = $request.headers["Cookie"] || $request.headers["cookie"] || "";
    return cookie;
}

function saveCookie(rawCookie) {
    if (!rawCookie || rawCookie.length < 10) {
        return false;
    }

    // 淘宝核心认证字段：cookie2、_tb_token_、sgcookie、unb
    const hasAuth = rawCookie.includes("cookie2") || rawCookie.includes("_tb_token_") || rawCookie.includes("sgcookie");

    if (hasAuth) {
        // 提取关键认证字段
        const fields = ["cookie2", "_tb_token_", "sgcookie", "unb", "lgc", "tracknick"];
        const usefulParts = [];
        fields.forEach(field => {
            const match = rawCookie.match(new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "=[^;]+"));
            if (match) usefulParts.push(match[0]);
        });

        if (usefulParts.length > 0) {
            $persistentStore.write(usefulParts.join("; "), cookieKey);
        } else {
            $persistentStore.write(rawCookie, cookieKey);
        }

        console.log("淘宝 Cookie 保存成功");
        $notification.post("淘宝淘金币", "✅ Cookie 获取成功", "Cookie 已保存，淘金币签到任务将自动运行");
        return true;
    } else {
        // 保存完整 Cookie
        $persistentStore.write(rawCookie, cookieKey);
        console.log("淘宝 Cookie 已保存（完整）");
        $notification.post("淘宝淘金币", "✅ Cookie 已保存", "请确认功能是否正常运行");
        return true;
    }
}

const cookie = getCookieFromRequest();
if (saveCookie(cookie)) {
    console.log("淘宝 Cookie 已保存");
} else {
    console.log("淘宝 Cookie 获取失败");
}

$done({});
