/**
 * 闲鱼 Cookie 获取脚本 (Surge http-request)
 * 
 * 触发条件：访问闲鱼 APP 用户信息页面
 * 自动捕获并保存 Cookie 到 Surge 持久化存储
 * 
 * 存储 Key：XY_COOKIE
 * 存储 Value：闲鱼 Cookie
 */

const cookieKey = "XY_COOKIE";

function getCookieFromRequest() {
    let cookie = $request.headers["Cookie"] || $request.headers["cookie"] || "";
    return cookie;
}

function saveCookie(rawCookie) {
    if (!rawCookie || rawCookie.length < 10) {
        return false;
    }

    // 闲鱼基于淘宝体系，核心字段同淘宝
    const hasAuth = rawCookie.includes("cookie2") || rawCookie.includes("_tb_token_") || rawCookie.includes("sgcookie");

    if (hasAuth) {
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

        console.log("闲鱼 Cookie 保存成功");
        $notification.post("闲鱼签到", "✅ Cookie 获取成功", "Cookie 已保存，签到任务将自动运行");
        return true;
    } else {
        $persistentStore.write(rawCookie, cookieKey);
        console.log("闲鱼 Cookie 已保存（完整）");
        $notification.post("闲鱼签到", "✅ Cookie 已保存", "请确认功能是否正常运行");
        return true;
    }
}

const cookie = getCookieFromRequest();
if (saveCookie(cookie)) {
    console.log("闲鱼 Cookie 已保存");
} else {
    console.log("闲鱼 Cookie 获取失败");
}

$done({});
