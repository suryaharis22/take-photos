import { IconPower } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Start = () => {
    const router = useRouter();
    const [cameraError, setCameraError] = useState(null);

    useEffect(() => {
        localStorage.clear();

        // Meminta izin akses kamera
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                console.log('Camera accessed successfully:', stream);
                // Lakukan sesuatu dengan stream kamera jika diinginkan
            })
            .catch((error) => {
                console.error('Error accessing camera:', error);
                setCameraError('Tidak dapat mengakses kamera. Pastikan izin diberikan atau kamera terhubung.');
            });
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            {cameraError && (
                <div className="text-red-500 mb-4">
                    {cameraError}
                </div>
            )}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <button onClick={() => router.push('/camera')}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-4 rounded-full"
                >
                    <IconPower />
                </button>
            </motion.div>
        </div>
    );
};

export default Start;
