const express = require('express');
const line = require('@line/bot-sdk');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// ดึงค่าจาก Environment Variables ที่ตั้งไว้ใน Vercel
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

  // Logic แยกคำสั่ง (แม่นยำระดับโลก)
  if (msg.includes("ฝันว่า")) {
    prompt = `คุณคือซินแสระดับโลก ทำนายฝันว่า "${msg}" ให้แม่นยำ บอกความหมายและเลขมงคล 2 ตัว 3 ตัว จัดรูปแบบสวยๆ`;
  } else if (msg.includes("ดวงรายวัน")) {
    prompt = `วิเคราะห์ดวงวันนี้วันที่ ${new Date().toLocaleDateString('th-TH')} แยกตามวันเกิดจันทร์-อาทิตย์ สั้นๆ เน้นงาน เงิน รัก และสีมงคล`;
  } else if (msg.includes("ดวงความรัก")) {
    prompt = `วิเคราะห์ดวงความรักช่วงนี้สำหรับคนโสดและคนมีคู่ พร้อมคำแนะนำเสริมดวงรัก`;
  } else {
    // ถ้าพิมพ์อย่างอื่นมา ให้บอททักทาย
    return client.replyMessage(event.replyToken, { 
      type: 'text', 
      text: "🔮 สวัสดีครับ! ผมคือ AI นักดูดวง\n- พิมพ์ 'ฝันว่า...' เพื่อทำนายฝัน\n- พิมพ์ 'ดวงรายวัน' เพื่อเช็คดวงวันนี้\n- พิมพ์ 'ดวงความรัก' เพื่อดูเรื่องหัวใจครับ" 
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return client.replyMessage(event.replyToken, { type: 'text', text: response.text() });
  } catch (error) {
    console.error(error);
    return client.replyMessage(event.replyToken, { type: 'text', text: "ขออภัยครับ จิตสัมผัสขัดข้องชั่วคราว ลองใหม่อีกครั้งนะ" });
  }
}

// สำคัญ: ต้อง Export app ออกไปให้ Vercel รัน
module.exports = app;
