const nodeMailer = require('nodeMailer');

const sendEmail = async (to, subject, text) => {
    try{
        const transporter = nodeMailer.createTransport({
            service: 'Gmail',
            auth:{
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        };
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error('Error sending email', error);
    }
};
module.exports = sendEmail;