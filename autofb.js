const axios = require('axios');
const fs = require('fs');
const path = require('path');

exports.config = {
    name: "autofb",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "XIE",
    description: "Tự động tải và phản hồi nội dung từ liên kết Facebook",
    commandCategory: "Công cụ",
    usages: [],
    cooldowns: 1
};

exports.run = () => {};

const isFacebookURL = u => /^https:\/\/(www\.)?facebook\.com\/.+/i.test(u);

exports.handleEvent = async function(o) {
    try {
        const str = o.event.body;
        const send = msg => o.api.sendMessage(msg, o.event.threadID, o.event.messageID);
        const head = app => `『 ${app.toUpperCase()} 』`;

        if (isFacebookURL(str)) {
            const links = await getFacebookLinks(str);

            for (const link of links) {
                try {
                    if (link.extension === 'jpg') {
                        const filePath = await downloadAndSave(link.url, link.extension, 'photo');
                        send({ attachment: fs.createReadStream(filePath) });
                        fs.unlinkSync(filePath);
                    } else if (link.extension === 'mp4') {
                        const videoLink = await downloadAndSave(link.url, link.extension, 'video');
                        send({ body: `Video Link: ${videoLink}` });
                    }
                } catch (error) {
                    console.log('Error downloading or sending file:', error);
                }
            }
        }
    } catch (e) {
        console.log('Error', e);
    }
};

async function getFacebookLinks(url) {
    const response = await axios.get(`https://api.kaiyocoder.repl.co/facebook/links?url=${encodeURIComponent(url)}`);
    return response.data;
}

async function downloadAndSave(url, extension, type) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    const folderPath = path.join(__dirname, '/xiefb');
    const fileName = `${Date.now()}.${extension}`;
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    fs.writeFileSync(filePath, Buffer.from(response.data, 'binary'));

    return filePath;
}
