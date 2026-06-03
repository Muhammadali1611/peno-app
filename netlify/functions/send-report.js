const TG_TOKEN = '8984956974:AAElcH2UWcEY73ujEITwI1YY5gaTJgeblDQ';
const TG_USERS = [7242956193, 248142126, 525237955, 8512434280, 7979572696];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { weekName, csvContent, summary } = JSON.parse(event.body);
    const filename = `peno_hisobot_${(weekName||'').replace(/[^a-zA-Z0-9]/g,'_')}.csv`;
    const csvBuffer = Buffer.from('\uFEFF' + csvContent, 'utf-8');
    const results = [];
    for (const chatId of TG_USERS) {
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: summary })
      });
      const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
      let body = '';
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
      body += `${chatId}\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="caption"\r\n\r\n`;
      body += `${weekName} hisobot\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="document"; filename="${filename}"\r\n`;
      body += `Content-Type: text/csv\r\n\r\n`;
      const bodyStart = Buffer.from(body, 'utf-8');
      const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
      const fullBody = Buffer.concat([bodyStart, csvBuffer, bodyEnd]);
      const fileRes = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendDocument`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: fullBody
      });
      const fileJson = await fileRes.json();
      results.push({ chatId, ok: fileJson.ok });
    }
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, results })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
