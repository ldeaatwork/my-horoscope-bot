const express = require('express');
const line = require('@line/bot-sdk');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// ดึงค่าจาก Environment Variables เพื่อความปลอดภัย
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const client = new line.Client(config);

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return null;

  const msg = event.message.text;
  let prompt = "";

  if (msg.includes("ฝันว่า")) {
    prompt = `คุณคือซินแสระดับโลก ทำนายฝันว่า "${msg}" ให้แม่นยำ บอกความหมายและเลขมงคล 2 ตัว 3 ตัว จัดรูปแบบสวยๆ`;
  } else if (msg.includes("ดวงรายวัน")) {
    prompt = `วิเคราะห์ดวงวันนี้วันที่ ${new Date().toLocaleDateString('th-TH')} แยกตามวันเกิดจันทร์-อาทิตย์ สั้นๆ เน้นงาน เงิน รัก`;
  } else if (msg.includes("ดวงความรัก")) {
    prompt = `วิเคราะห์ดวงความรักช่วงนี้สำหรับคนโสดและคนมีคู่ พร้อมคำแนะนำเสริมดวง`;
  } else {
    return client.replyMessage(event.replyToken, { 
      type: 'text', 
      text: "สวัสดีครับ! พิมพ์ 'ฝันว่า...' หรือ 'ดวงรายวัน' เพื่อเริ่มดูดวงได้เลย" 
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return client.replyMessage(event.replyToken, { type: 'text', text: response.text() });
  } catch (error) {
    return client.replyMessage(event.replyToken, { type: 'text', text: "ขออภัยครับ จิตสัมผัสขัดข้องชั่วคราว" });
  }
}

module.exports = app;