/**
 * 京东 Cookie 获取脚本 (Surge http-request)
 * 
 * 触发条件：任何 api.m.jd.com 请求
 * 自动从请求头中提取 pt_key + pt_pin 保存到 Surge 持久化存储
 * 
 * 存储 Key：JD_COOKIE
 */

const cookieKey = "JD_COOKIE";

const cookie = $request.headers["Cookie"] || $request.headers["cookie"] || "";

if (cookie && (cookie.includes("pt_key") || cookie.includes("pt_pin"))) {
    // 只提取 pt_key 和 pt_pin
    const fields = ["pt_key", "pt_pin"];
    const usefulParts = [];
    fields.forEach(field => {
        const match = cookie.match(new RegExp(field + "=[^;]+"));
        if (match) usefulParts.push(match[0]);
    });

    if (usefulParts.length >= 2) {
        const savedCookie = usefulParts.join("; ");
        $persistentStore.write(savedCookie, cookieKey);
        console.log("京东 Cookie 保存成功");
        $notification.post("京东签到", "✅ Cookie 获取成功", savedCookie.substring(0, 50) + "...");
    } else if (usefulParts.length === 1) {
        $notification.post("京东签到", "⚠️ Cookie 不完整", "只获取到 " + usefulParts[0].split("=")[0] + "，请继续浏览京东APP");
    } else {
        $notification.post("京东签到", "❌ Cookie 获取失败", "未找到 pt_key 和 pt_pin");
    }
} else if (cookie && cookie.length > 0) {
    console.log("京东请求但无有效Cookie (cookie长度: " + cookie.length + ")");
} else {
    console.log("京东请求无Cookie");
}

$done({});
