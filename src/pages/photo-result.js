import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

const PhotoResult = () => {
    const [photos, setPhotos] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const storedPhotos = localStorage.getItem("capturedPhotos");
        if (storedPhotos) {
            setPhotos(JSON.parse(storedPhotos)); // Mengambil foto dari localStorage
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <h1 className="text-2xl font-bold mb-6 text-center">Hasil Foto</h1>

            <div className="flex flex-wrap justify-center gap-4">
                {photos.map((photo, index) => (
                    <motion.div
                        key={index}
                        className="w-full max-w-xs rounded-lg shadow-lg overflow-hidden bg-white"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <img src={photo} alt={`Hasil Foto ${index + 1}`} className="w-full object-cover" />
                    </motion.div>
                ))}
            </div>

            <motion.button
                onClick={() => {
                    localStorage.clear();
                    router.push("/");
                }}
                className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                Kembali ke Kamera
            </motion.button>
        </div>
    );
};

export default PhotoResult;
