// components/Watermark.js
import { useEffect, useState } from 'react';

const Watermark = ({ imageUrl }) => {
    const [watermarkedImage, setWatermarkedImage] = useState('');

    useEffect(() => {
        const fetchWatermarkedImage = async () => {
            try {
                const response = await fetch(`/api/watermark?imageUrl=${encodeURIComponent(imageUrl)}`);
                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    setWatermarkedImage(url);
                } else {
                    console.error('Failed to fetch watermarked image');
                }
            } catch (error) {
                console.error('Error fetching watermarked image:', error);
            }
        };

        fetchWatermarkedImage();
    }, [imageUrl]);

    return (
        <div className="flex items-center justify-center w-full h-full">
            {watermarkedImage ? (
                <img src={watermarkedImage} alt="Watermarked Image" className="w-full h-full object-cover" />
            ) : (
                <p className="text-gray-500">Loading...</p>
            )}
        </div>
    );
};

export default Watermark;
