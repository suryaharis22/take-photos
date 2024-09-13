// pages/index.js

import Watermark from "@/components/Watermark";

const ImageWM = () => {
    const imageUrl = 'https://faceid.nuncorp.id/worker/all_image/image-1726219429328-1418.jpg'; // Ganti dengan URL gambar yang diinginkan

    return (
        <div>
            <h1>Gambar dengan Watermark</h1>
            <Watermark imageUrl={imageUrl} />
        </div>
    );
};

export default ImageWM;
