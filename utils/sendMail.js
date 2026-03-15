const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');
const logger = require('./logger');

// Singleton transporter with connection pooling
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  pool: true,
  maxConnections: 5,
  auth: {
    user: process.env.STAMP_MAIL,
    pass: process.env.STAMP_PASSWORD
  }
});

const sendEmail = async (to, subject, html, from) => {
  const options = {
    from: from || process.env.STAMP_MAIL,
    to,
    subject,
    text: htmlToText(html, { wordwrap: 130 }),
    html
  };

  const info = await transporter.sendMail(options);
  logger.info('Email sent successfully', {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info)
  });
};

exports.sendMail = async data => {
  const html = pug.renderFile(
    `${__dirname}/../views/email/${data.template}.pug`,
    {
      firstName: data.name,
      url: data.url,
      website: data.website,
      manager: data.manager,
      subject: data.subject
    }
  );

  await sendEmail(data.to, data.subject, html, data.from);
};

exports.getMailForService = async data => {
  const html = pug.renderFile(
    `${__dirname}/../views/email/contactMessage.pug`,
    {
      name: data.name,
      phone: data.phone,
      email: data.email,
      description: data.description
    }
  );

  await sendEmail(data.to, `طلب خدمة من ${data.name}`, html, data.from);
};

exports.getMailForTestimonial = async data => {
  const html = pug.renderFile(`${__dirname}/../views/email/testimonial.pug`, {
    name: data.name,
    email: data.email,
    description: data.description
  });

  await sendEmail(data.to, `تقييم من ${data.name}`, html, data.from);
};
