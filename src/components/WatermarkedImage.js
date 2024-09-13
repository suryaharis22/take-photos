import { useEffect, useRef } from 'react';

const WatermarkedImage = ({ imageUrl, logoUrl }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const logo = new Image();

        img.crossOrigin = 'Anonymous'; // Untuk menghindari masalah CORS
        logo.crossOrigin = 'Anonymous'; // Untuk menghindari masalah CORS
        img.src = imageUrl;
        logo.src = logoUrl;

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            logo.onload = () => {
                const logoWidth = 100; // Lebar logo
                const logoHeight = 100; // Tinggi logo
                const xPosition = (img.width - logoWidth) / 2;
                const yPosition = (img.height - logoHeight) / 2;

                // const xPosition = img.width - logoWidth - 10; // Posisi X logo
                // const yPosition = img.height - logoHeight - 10; // Posisi Y logo
                ctx.drawImage(logo, xPosition, yPosition, logoWidth, logoHeight);
            };
        };
    }, [imageUrl, logoUrl]);

    return <canvas ref={canvasRef} className={'w-full h-full object-cover'}></canvas>;
};

export default WatermarkedImage;
