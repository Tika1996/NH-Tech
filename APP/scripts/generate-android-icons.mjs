import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

const sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
};

const foregroundSizes = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432,
};

async function generateIcons() {
    console.log('Generating Android icons from logo.png...');

    for (const [folder, size] of Object.entries(sizes)) {
        const outPath = path.join(resDir, folder, 'ic_launcher.png');
        await sharp(logoPath)
            .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png()
            .toFile(outPath);
        console.log(`✓ ${folder}/ic_launcher.png (${size}x${size})`);

        const roundPath = path.join(resDir, folder, 'ic_launcher_round.png');
        // For round icons, create a circular version
        const roundMask = Buffer.from(
            `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
        );
        await sharp(logoPath)
            .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .composite([{ input: roundMask, blend: 'dest-in' }])
            .png()
            .toFile(roundPath);
        console.log(`✓ ${folder}/ic_launcher_round.png (${size}x${size})`);
    }

    // Generate foreground icons for adaptive icons
    for (const [folder, size] of Object.entries(foregroundSizes)) {
        const fgPath = path.join(resDir, folder, 'ic_launcher_foreground.png');
        await sharp(logoPath)
            .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png()
            .toFile(fgPath);
        console.log(`✓ ${folder}/ic_launcher_foreground.png (${size}x${size})`);
    }

    console.log('\n✅ All Android icons generated successfully!');
}

generateIcons().catch(console.error);
