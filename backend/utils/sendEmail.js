
const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const sendEmail = async (to, subject, html) => {
  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  const emailLines = [
    `From: Login Dashboard <${process.env.EMAIL_USER}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    html,
  ];

  const rawEmail = Buffer.from(emailLines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: rawEmail,
    },
  });

  return response.data;
};

module.exports = sendEmail;
