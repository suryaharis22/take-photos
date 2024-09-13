// pages/api/watermark.js
import { createCanvas, loadImage } from 'canvas';
import fetch from 'node-fetch';
import path from 'path';

export default async function handler(req, res) {
    try {
        // Mendapatkan URL gambar dari request
        const { imageUrl } = req.query;
        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        // Mengambil gambar dari URL
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch image');
        }
        const imageBuffer = await response.buffer();
        const image = await loadImage(imageBuffer);

        // Membuat canvas
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        // Menggambar gambar ke canvas
        ctx.drawImage(image, 0, 0);

        // Menambahkan watermark di tengah gambar
        const watermarkPath = path.join(process.cwd(), 'public', 'logo.png');
        const watermark = await loadImage(watermarkPath);
        const watermarkWidth = 400; // Atur lebar watermark
        const watermarkHeight = 400; // Atur tinggi watermark
        const x = (image.width - watermarkWidth) / 2;
        const y = (image.height - watermarkHeight) / 2;
        ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);

        // Mengirim gambar dengan watermark
        res.setHeader('Content-Type', 'image/png');
        res.send(canvas.toBuffer('image/png'));
    } catch (error) {
        res.status(500).json({ error: 'Failed to process image' });
    }
}
