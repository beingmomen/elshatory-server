const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');

exports.sendMail = catchAsync(async data => {
  // 1) Render HTML based on a pug template
  const html = await pug.renderFile(
    `${__dirname}/../views/email/${data.template}.pug`,
    {
      firstName: data.firstName,
      url: data.url,
      website: data.website,
      manager: data.manager,
      subject: data.subject
    }
  );

  const transporter = await nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.STAMP_MAIL,
      pass: process.env.STAMP_PASSWORD
    }
  });

  // send mail with defined transport object
  const options = {
    from: data.from, // sender address
    to: data.to, // list of receivers
    subject: data.subject, // Subject line
    text: htmlToText.fromString(html), // plain text body
    html // html body
  };

  try {
    const info = await transporter.sendMail(options);
    console.log('info :>> ', info);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.log('error :>> ', error);
  }
});
