const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const CLIENT_ID = process.env.CLIENT_ID

const CLEINT_SECRET = process.env.CLEINT_SECRET
const REDIRECT_URI = process.env.CALLBACK_URL;


const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);

async function sendMail(user) {
    console.log("HELoo I am in email1--------------")
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    let existingUser = await Google.findOne({ 'id': user.id });
    const REFRESH_TOKEN=existingUser.refreshToken
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'dhrvtest@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLEINT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: 'dhrvtest@gmail.com',
      to: 'dhruvrocky2001@gmail.com',
      subject: 'Hello from gmail using API',
      text: 'Hello from gmail email using API',
      html: '<h1>Hello from gmail email using API</h1>',
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
return error  }

}

module.exports=sendMail