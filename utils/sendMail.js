const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');
const logger = require('./logger');

exports.sendMail = async data => {
  // 1) Render HTML based on a pug template
  const html = await pug.renderFile(
    `${__dirname}/../views/email/${data.template}.pug`,
    {
      firstName: data.name,
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
    text: htmlToText(html, {
      wordwrap: 130
    }), // plain text body
    html // html body
  };

  const info = await transporter.sendMail(options);
  logger.info('Email sent successfully', {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info)
  });
};
