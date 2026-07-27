const sharp = require('sharp');

const blackDove = 'assets/brand/mds-dove-black.svg';
const whiteDove = 'assets/brand/mds-dove-white.svg';

async function renderTransparent(source, output, size) {
  await sharp(source).resize(size, size, { fit: 'contain' }).png().toFile(output);
}

async function renderCenteredIcon(source, output, size, background, innerSize) {
  const logo = await sharp(source).resize(innerSize, innerSize, { fit: 'contain' }).png().toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([
      {
        input: logo,
        left: Math.round((size - innerSize) / 2),
        top: Math.round((size - innerSize) / 2),
      },
    ])
    .png()
    .toFile(output);
}

async function main() {
  await renderTransparent(blackDove, 'assets/brand/mds-dove-black.png', 1024);
  await renderTransparent(whiteDove, 'assets/brand/mds-dove-white.png', 1024);

  await renderCenteredIcon(blackDove, 'assets/icon.png', 1024, '#ffffff', 780);
  await renderCenteredIcon(whiteDove, 'assets/android-icon-foreground.png', 512, { r: 0, g: 0, b: 0, alpha: 0 }, 330);
  await renderCenteredIcon(blackDove, 'assets/android-icon-monochrome.png', 432, { r: 0, g: 0, b: 0, alpha: 0 }, 310);
  await renderCenteredIcon(blackDove, 'assets/favicon.png', 48, '#ffffff', 34);
  await renderCenteredIcon(whiteDove, 'assets/splash-icon.png', 1024, { r: 0, g: 0, b: 0, alpha: 0 }, 520);

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#1b6fd7',
    },
  })
    .png()
    .toFile('assets/android-icon-background.png');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
