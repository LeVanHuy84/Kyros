package com.assistant.kernel.util;

public final class KyrosEmailTemplate {

  private KyrosEmailTemplate() {}

  private static final String BRAND_COLOR_PRIMARY = "#4F46E5"; // Indigo
  private static final String BRAND_COLOR_SECONDARY = "#0E82A7"; // Premium Ocean Blue
  private static final String BG_BODY = "#F8FAFC";
  private static final String BG_CARD = "#FFFFFF";
  private static final String TEXT_MAIN = "#0F172A";
  private static final String TEXT_MUTED = "#64748B";

  // Stylized Hexagon + K logo in SVG format
  private static final String KYROS_LOGO_SVG =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='44' height='44'"
          + " style='display: block; margin: 0 auto;'>  <polygon points='50,5 90,28 90,72 50,95"
          + " 10,72 10,28' fill='"
          + BRAND_COLOR_PRIMARY
          + "' />  <path d='M38,25 L38,75 M38,50 L62,25 M38,50 L62,75' stroke='#FFFFFF'"
          + " stroke-width='10' stroke-linecap='round' stroke-linejoin='round' /></svg>";

  public static String buildVerificationEmail(String verificationLink) {
    return buildEmailLayout(
        "Verify Your Account",
        "<h3>Verify Your Email Address</h3>"
            + "<p style='margin: 16px 0 24px; color: "
            + TEXT_MAIN
            + "; font-size: 16px; line-height: 24px;'>Welcome to Kyros! Thank you for signing up."
            + " Please verify your email address to activate your account and start using your"
            + " Personal AI Operating System.</p><div style='text-align: center; margin: 32px 0;'> "
            + " <a href='"
            + verificationLink
            + "' style='background-color: "
            + BRAND_COLOR_PRIMARY
            + "; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: 600;"
            + " font-size: 16px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px"
            + " rgba(79, 70, 229, 0.15);'>Verify My Email Address</a></div><p style='color: "
            + TEXT_MUTED
            + "; font-size: 14px; line-height: 20px; margin-top: 24px;'>This verification link is"
            + " valid for <strong>1 hour</strong>. If you did not create a Kyros account, please"
            + " disregard this email.</p>");
  }

  public static String buildNotificationEmail(
      String title, String content, String urgencyLevel, String frontendUrl) {
    String urgencyBadgeColor;
    if ("Critical".equalsIgnoreCase(urgencyLevel)) {
      urgencyBadgeColor = "#EF4444"; // Red
    } else if ("Urgent".equalsIgnoreCase(urgencyLevel)) {
      urgencyBadgeColor = "#F59E0B"; // Amber
    } else {
      urgencyBadgeColor = BRAND_COLOR_SECONDARY; // Blue
    }

    return buildEmailLayout(
        "Notification: " + title,
        "<div style='border-left: 4px solid "
            + urgencyBadgeColor
            + "; padding-left: 16px; margin: 16px 0 24px;'>"
            + "  <span style='background-color: "
            + urgencyBadgeColor
            + "; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase;"
            + " padding: 4px 8px; border-radius: 4px; display: inline-block; margin-bottom: 8px;'>"
            + urgencyLevel
            + "</span>"
            + "  <h3 style='margin: 4px 0 0 0; color: "
            + TEXT_MAIN
            + "; font-size: 20px; font-weight: 700;'>"
            + title
            + "</h3>"
            + "</div>"
            + "<div style='color: "
            + TEXT_MAIN
            + "; font-size: 16px; line-height: 24px; white-space: pre-line; background-color:"
            + " #F1F5F9; padding: 16px; border-radius: 8px; margin-bottom: 24px;'>"
            + content
            + "</div>"
            + "<p style='color: "
            + TEXT_MUTED
            + "; font-size: 14px; line-height: 20px; margin-top: 16px; border-top: 1px solid"
            + " #E2E8F0; padding-top: 16px;'>View details and take action by signing into your <a"
            + " href='"
            + frontendUrl
            + "' style='color: "
            + BRAND_COLOR_PRIMARY
            + "; text-decoration: none; font-weight: 500;'>Kyros Dashboard</a>."
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
        + "      .card { padding: 24px !important; radius: 8px !important; }"
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
        + "              <p style='margin: 4px 0 0 0; font-size: 14px; color: "
        + TEXT_MUTED
        + "; font-weight: 500;'>AI Executive Assistant</p>"
        + "            </td>"
        + "          </tr>"
        + "          <!-- Card Content -->"
        + "          <tr>"
        + "            <td class='card' style='background-color: "
        + BG_CARD
        + "; border: 1px solid #E2E8F0; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px"
        + " -1px rgba(0,0,0,0.05); text-align: left;'>"
        + bodyContent
        + "            </td>"
        + "          </tr>"
        + "          <!-- Footer Section -->"
        + "          <tr>"
        + "            <td align='center' style='padding-top: 32px; color: "
        + TEXT_MUTED
        + "; font-size: 12px; line-height: 18px;'>              &copy; 2026 Kyros.ai. All rights"
        + " reserved.<br>              This is an automated operational notification regarding your"
        + " Kyros workspace.            </td>          </tr>        </table>      </td>    </tr> "
        + " </table></body></html>";
  }
}
