import express, { text } from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4500;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'happy000event@gmail.com',
        pass: 'blpf vvqf tkem lsck',
    },
});

app.post('/Contact', (req, res) => {
    const userInfo = req.body;

    const mailOptions = {
        from: 'Caster Serv',
        to: userInfo.email,
        subject: 'Chào mừng đến với Caster Serv',
        html: `
  <h3>Xin chào ${userInfo.name},</h3>
  <p>Cảm ơn bạn đã liên hệ với <b>Caster Serv</b>.</p>
  <p><strong>Thông tin của bạn:</strong></p>
  <ul>
    <li><b>Email:</b> ${userInfo.email}</li>
    <li><b>Số điện thoại:</b> ${userInfo.phone}</li>
    <li><b>Nội dung:</b> ${userInfo.message.replace(/\n/g, '<br/>')}</li>
  </ul>
  <p>Chúng tôi sẽ phản hồi bạn sớm nhất có thể.</p>
  <p>Trân trọng,<br/>
     <i>Đội ngũ Caster Serv</i>
  </p>
`,


    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Gửi mail thất bại:', error);
            res.status(500).send('Lỗi khi gửi email');
        } else {
            console.log('Gửi thành công:', info.response);
            res.status(200).send('Gửi email thành công');
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
