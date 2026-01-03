const axios = require('axios');
const cheerio = require('cheerio');

// Class ShortUrl dari kode Anda
class ShortUrl {
    isgd = async function (url) {
        try {
            if (!url.includes('https://')) throw new Error('URL harus menggunakan https://');
            
            const { data } = await axios.post('https://cors.caliph.my.id/https://is.gd/create.php', new URLSearchParams({
                url: url,
                shorturl: '',
                opt: 0
            }).toString(), {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    origin: 'https://is.gd',
                    referer: 'https://is.gd/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
                }
            });
            
            const $ = cheerio.load(data);
            const result = $('input#short_url').attr('value');
            if (!result) throw new Error('Gagal memendekkan URL (Is.gd).');
            
            return result;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    tinube = async function (url, suffix = '') {
        try {
            if (!url.includes('https://')) throw new Error('URL harus menggunakan https://');
            
            const { data } = await axios.post('https://tinu.be/en', [{
                longUrl: url,
                urlCode: suffix
            }], {
                headers: {
                    'next-action': '74b2f223fe2b6e65737e07eeabae72c67abf76b2', // Hash ini mungkin kadaluarsa jika tinu.be update
                    'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22(site)%22%2C%7B%22children%22%3A%5B%5B%22lang%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
                    origin: 'https://tinu.be',
                    referer: 'https://tinu.be/en',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
                }
            });
            
            // Parsing response logic
            const line = data.split('\n').find(line => line.startsWith('1:'));
            if(!line) throw new Error("Gagal parsing respon Tinu.be");

            const jsonData = JSON.parse(line.substring(2));
            const result = jsonData?.data?.urlCode;
            
            if (!result) throw new Error('Suffix sudah digunakan atau error server.');
            
            return 'https://tinu.be/' + result;
        } catch (error) {
            console.error(error);
            throw new Error('Gagal: ' + error.message);
        }
    }
}

// Handler utama Vercel
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url, provider, suffix } = req.body;
    const shortener = new ShortUrl();

    try {
        let resultUrl;
        if (provider === 'tinube') {
            resultUrl = await shortener.tinube(url, suffix);
        } else {
            resultUrl = await shortener.isgd(url);
        }
        
        res.status(200).json({ success: true, url: resultUrl });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
