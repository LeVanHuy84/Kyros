package com.assistant.kernel.util;

public final class KyrosEmailTemplate {

  private KyrosEmailTemplate() {}

  // Brand Palette aligned with Angular App Design (Deep Sage, Forest Green, Warm Ochre, Fresh Mint)
  private static final String BRAND_COLOR_PRIMARY = "#2d6a4f"; // Forest Green
  private static final String BRAND_COLOR_DARK = "#1b4332"; // Deep Sage Green
  private static final String BRAND_COLOR_LIGHT = "#40916c"; // Emerald Accent
  private static final String BG_BODY = "#f4f9f5"; // Natural Soft Sage Background
  private static final String BG_CARD = "#ffffff";
  private static final String TEXT_MAIN = "#132a1f"; // Deep Evergreen
  private static final String TEXT_MUTED = "#52796f"; // Sage Muted Text
  private static final String BORDER_COLOR = "#d8e2dc"; // Subtle Soft Mint Border

  private static final String KYROS_LOGO_SVG =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' width='52' height='52'"
          + " style='display: block; margin: 0 auto;'>  <defs>    <linearGradient"
          + " id='kyros-bg-grad' x1='0%' y1='0%' x2='100%' y2='100%'>      <stop offset='0%'"
          + " stop-color='#1b4332' />      <stop offset='50%' stop-color='#2d6a4f' />      <stop"
          + " offset='100%' stop-color='#40916c' />    </linearGradient>    <linearGradient"
          + " id='kyros-warm-grad' x1='0%' y1='100%' x2='100%' y2='0%'>      <stop offset='0%'"
          + " stop-color='#d4a373' />      <stop offset='100%' stop-color='#faedcd' />   "
          + " </linearGradient>    <linearGradient id='kyros-light-grad' x1='0%' y1='0%' x2='0%'"
          + " y2='100%'>      <stop offset='0%' stop-color='#ffffff' />      <stop offset='100%'"
          + " stop-color='#e8f5e9' />    </linearGradient>  </defs>  <rect x='32' y='32'"
          + " width='448' height='448' rx='112' fill='url(#kyros-bg-grad)' />  <rect x='34' y='34'"
          + " width='444' height='444' rx='110' fill='none' stroke='rgba(255, 255, 255, 0.15)'"
          + " stroke-width='3' />  <g transform='translate(4, 0)'>    <rect x='150' y='120'"
          + " width='44' height='272' rx='22' fill='url(#kyros-light-grad)' />    <path d='M 172"
          + " 256 C 210 256 315 190 348 152 C 368 128 344 102 318 118 C 265 150 205 218 172 256 Z'"
          + " fill='url(#kyros-warm-grad)' />    <path d='M 172 256 C 210 256 315 322 348 360 C 368"
          + " 384 344 410 318 394 C 265 362 205 294 172 256 Z' fill='#d8f3dc' opacity='0.92' />   "
          + " <circle cx='172' cy='256' r='26' fill='#ffffff' />    <circle cx='172' cy='256'"
          + " r='15' fill='#2d6a4f' />    <circle cx='172' cy='256' r='6' fill='#d4a373' />  </g>"
          + "</svg>";

  public static String buildVerificationEmail(String verificationLink) {
    return buildEmailLayout(
        "Verify Your Account",
        "<h3 style='margin: 0 0 16px; color: "
            + TEXT_MAIN
            + "; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;'>Xác Thực Tài Khoản /"
            + " Verify Email</h3><p style='margin: 0 0 24px; color: "
            + TEXT_MAIN
            + "; font-size: 15px; line-height: 24px;'>Chào mừng bạn đến với <strong>Kyros"
            + " AI</strong>! Cảm ơn bạn đã đăng ký. Vui lòng nhấn vào nút bên dưới để xác thực tài"
            + " khoản và bắt đầu sử dụng Trợ lý Điều hành Thông minh của bạn.</p><div"
            + " style='text-align: center; margin: 32px 0;'>  <a href='"
            + verificationLink
            + "' style='background: linear-gradient(135deg, "
            + BRAND_COLOR_DARK
            + " 0%, "
            + BRAND_COLOR_PRIMARY
            + " 50%, "
            + BRAND_COLOR_LIGHT
            + " 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: 600;"
            + " font-size: 15px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px"
            + " rgba(45, 106, 79, 0.25);'>Xác Thực Ngay (Verify Account)</a></div><div"
            + " style='background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;"
            + " padding: 12px 16px; margin-top: 24px;'>  <p style='color: "
            + TEXT_MUTED
            + "; font-size: 13px; line-height: 18px; margin: 0;'>⏱️ Liên kết xác thực này có hiệu"
            + " lực trong vòng <strong>1 giờ</strong>. Nếu bạn không tạo tài khoản này, vui lòng bỏ"
            + " qua email.</p></div>");
  }

  public static String buildNotificationEmail(
      String title, String content, String urgencyLevel, String frontendUrl) {
    String urgencyBadgeColor;
    String urgencyBgColor;
    if ("Critical".equalsIgnoreCase(urgencyLevel)) {
      urgencyBadgeColor = "#dc2626"; // Crimson Red
      urgencyBgColor = "#fef2f2";
    } else if ("Urgent".equalsIgnoreCase(urgencyLevel)) {
      urgencyBadgeColor = "#d97706"; // Warm Amber
      urgencyBgColor = "#fffbeb";
    } else {
      urgencyBadgeColor = BRAND_COLOR_PRIMARY; // Forest Green
      urgencyBgColor = "#f0fdf4";
    }

    return buildEmailLayout(
        "Notification: " + title,
        "<div style='border-left: 4px solid "
            + urgencyBadgeColor
            + "; background-color: "
            + urgencyBgColor
            + "; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;'>"
            + "  <span style='background-color: "
            + urgencyBadgeColor
            + "; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase;"
            + " letter-spacing: 0.5px; padding: 3px 8px; border-radius: 4px; display: inline-block;"
            + " margin-bottom: 8px;'>"
            + urgencyLevel
            + "</span>"
            + "  <h3 style='margin: 0; color: "
            + TEXT_MAIN
            + "; font-size: 18px; font-weight: 700;'>"
            + title
            + "</h3>"
            + "</div>"
            + "<div style='color: "
            + TEXT_MAIN
            + "; font-size: 15px; line-height: 24px; white-space: pre-line; background-color:"
            + " #f8fafc; border: 1px solid "
            + BORDER_COLOR
            + "; padding: 18px; border-radius: 10px; margin-bottom: 24px;'>"
            + content
            + "</div>"
            + "<p style='color: "
            + TEXT_MUTED
            + "; font-size: 13px; line-height: 20px; margin-top: 16px; border-top: 1px solid "
            + BORDER_COLOR
            + "; padding-top: 16px;'>Xem chi tiết và xử lý tại <a href='"
            + frontendUrl
            + "' style='color: "
            + BRAND_COLOR_PRIMARY
            + "; text-decoration: none; font-weight: 600;'>Kyros Dashboard</a>."
            + "</p>");
  }

  private static String buildEmailLayout(String preheader, String bodyContent) {
    return "<!DOCTYPE html>"
        + "<html>"
        + "<head>"
        + "  <meta charset='utf-8'>"
        + "  <meta name='viewport' content='width=device-width, initial-scale=1'>"
        + "  <title>"
        + preheader
        + "</title>  <style>    body { font-family: 'Inter', system-ui, -apple-system, sans-serif;"
        + " background-color: "
        + BG_BODY
        + "; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }"
        + "    @media only screen and (max-width: 600px) {"
        + "      .container { width: 100% !important; padding: 12px !important; }"
        + "      .card { padding: 24px !important; border-radius: 8px !important; }"
        + "    }"
        + "  </style>"
        + "</head>"
        + "<body style='background-color: "
        + BG_BODY
        + "; margin: 0; padding: 0 12px;'>  <table width='100%' border='0' cellspacing='0'"
        + " cellpadding='0' style='background-color: "
        + BG_BODY
        + "; padding: 40px 0;'>    <tr>      <td align='center'>        <table class='container'"
        + " width='600' border='0' cellspacing='0' cellpadding='0' style='width: 600px;'>         "
        + " <!-- Header Section -->          <tr>            <td align='center'"
        + " style='padding-bottom: 24px;'>              <div style='margin-bottom: 12px;'>"
        + KYROS_LOGO_SVG
        + "</div>              <h1 style='margin: 0; font-size: 24px; font-weight: 800;"
        + " letter-spacing: -0.5px; color: "
        + TEXT_MAIN
        + ";'>Kyros</h1>"
        + "              <p style='margin: 4px 0 0 0; font-size: 13px; color: "
        + TEXT_MUTED
        + "; font-weight: 500; letter-spacing: 0.2px;'>AI EXECUTIVE ASSISTANT</p>"
        + "            </td>"
        + "          </tr>"
        + "          <!-- Card Content -->"
        + "          <tr>"
        + "            <td class='card' style='background-color: "
        + BG_CARD
        + "; border: 1px solid "
        + BORDER_COLOR
        + "; border-radius: 14px; padding: 36px; box-shadow: 0 4px 16px -2px rgba(27, 67, 50,"
        + " 0.08); text-align: left;'>"
        + bodyContent
        + "            </td>"
        + "          </tr>"
        + "          <!-- Footer Section -->"
        + "          <tr>"
        + "            <td align='center' style='padding-top: 32px; color: "
        + TEXT_MUTED
        + "; font-size: 12px; line-height: 18px;'>"
        + "              &copy; 2026 <strong>Kyros AI</strong>. All rights reserved.<br>"
        + "              Thông báo vận hành tự động từ không gian làm việc Kyros của bạn."
        + "            </td>"
        + "          </tr>"
        + "        </table>"
        + "      </td>"
        + "    </tr>"
        + "  </table>"
        + "</body>"
        + "</html>";
  }
}
