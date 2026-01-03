const axios = require('axios');
const cheerio = require('cheerio');

class ShortUrl {
    // FIX: Menghapus proxy CORS karena ini berjalan di server side (Node.js)
    isgd = async function (url) {
        try {
            const response = await axios.post('https://is.gd/create.php', new URLSearchParams({
                url: url,
                shorturl: '',
                opt: 0
            }).toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            // is.gd kadang return HTML penuh, kadang simple response. Kita parse aman.
            const $ = cheerio.load(response.data);
            const result = $('input#short_url').attr('value');
            
            if (!result) {
                // Fallback jika is.gd mengembalikan error text langsung di body
                if(response.data.includes('Error:')) {
                     throw new Error('URL Invalid atau ditolak oleh is.gd');
                }
                throw new Error('Gagal memproses response is.gd');
            }
            
            return result;
        } catch (error) {
            console.error("Is.gd Error:", error.message);
            throw new Error('Gagal memendekkan link (is.gd). Coba link lain.');
        }
    }
    
    tinube = async function (url, suffix = '') {
        try {
            // Header ini HARUS valid. Jika tinu.be update, ini bisa gagal.
            const { data } = await axios.post('https://tinu.be/en', [{
                longUrl: url,
                urlCode: suffix
            }], {
                headers: {
                    'next-action': '74b2f223fe2b6e65737e07eeabae72c67abf76b2',
                    'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22(site)%22%2C%7B%22children%22%3A%5B%5B%22lang%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
                    'origin': 'https://tinu.be',
                    'referer': 'https://tinu.be/en',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                    'content-type': 'text/plain;charset=UTF-8'
                }
            });
            
            // Parsing Logic yang lebih aman
            const lines = typeof data === 'string' ? data.split('\n') : [];
            const targetLine = lines.find(line => line.startsWith('1:'));
            
            if (!targetLine) throw new Error('Format response Tinu.be berubah.');

            const jsonStr = targetLine.substring(2); // Hapus "1:"
            const parsed = JSON.parse(jsonStr);
            const result = parsed?.data?.urlCode;
            
            if (!result) throw new Error('Alias sudah dipakai atau URL tidak valid.');
            
            return 'https://tinu.be/' + result;
        } catch (error) {
            console.error("Tinu.be Error:", error.message);
            throw new Error(error.message || 'Gagal koneksi ke Tinu.be');
        }
    }
}

export default async function handler(req, res) {
    // CORS Configuration untuk API
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { url, provider, suffix } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL wajib diisi' });
    }

    const shortener = new ShortUrl();

    try {
        let resultUrl;
        if (provider === 'tinube') {
            resultUrl = await shortener.tinube(url, suffix);
        } else {
            resultUrl = await shortener.isgd(url);
        }
        
        return res.status(200).json({ success: true, url: resultUrl });
    } catch (error) {
        // PENTING: Jangan throw error HTML, selalu return JSON error
        return res.status(500).json({ success: false, error: error.message });
    }
}
