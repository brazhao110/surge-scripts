/**
 * 京东金融 Cookie 获取脚本 (Surge http-request)
 * 
 * 触发条件：访问京东金融 APP 相关页面（养大鹅/养猪猪等）
 * 自动捕获并保存 Cookie 到 Surge 持久化存储
 * 
 * 存储 Key：JDJR_COOKIE
 * 存储 Value：京东金融 Cookie
 */

const cookieKey = "JDJR_COOKIE";

function getCookieFromRequest() {
    let cookie = $request.headers["Cookie"] || $request.headers["cookie"] || "";
    return cookie;
}

function saveCookie(rawCookie) {
    if (!rawCookie || rawCookie.length < 10) {
        return false;
    }

    // 京东金融核心字段：cookie2、pt_key、pt_pin、pwd
    const hasAuth = rawCookie.includes("cookie2") || rawCookie.includes("pt_key") || rawCookie.includes("pwd");

    if (hasAuth) {
        // 提取关键认证字段
        const fields = ["cookie2", "pt_key", "pt_pin", "pwd", "pin"];
        const usefulParts = [];
        fields.forEach(field => {
            const match = rawCookie.match(new RegExp(field + "=[^;]+"));
            if (match) usefulParts.push(match[0]);
        });

        if (usefulParts.length > 0) {
            $persistentStore.write(usefulParts.join("; "), cookieKey);
        } else {
            $persistentStore.write(rawCookie, cookieKey);
        }

        console.log("京东金融 Cookie 保存成功");
        $notification.post("京东金融", "✅ Cookie 获取成功", "Cookie 已保存，养大鹅/养猪猪任务将自动运行");
        return true;
    } else {
        // 尝试保存全部 Cookie（可能 cookie 字段名不同）
        $persistentStore.write(rawCookie, cookieKey);
        console.log("京东金融 Cookie 已保存（完整）");
        $notification.post("京东金融", "✅ Cookie 已保存", "请确认功能是否正常运行");
        return true;
    }
}

const cookie = getCookieFromRequest();
if (saveCookie(cookie)) {
    console.log("京东金融 Cookie 已保存");
} else {
    console.log("京东金融 Cookie 获取失败");
}

$done({});
