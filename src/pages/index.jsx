import { IconPower, IconUpload, IconUserScan } from "@tabler/icons-react";
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
                // Lakukan sesuatu dengan stream kamera jika diinginkan
            })
            .catch((error) => {
                console.error('Error accessing camera:', error);
                setCameraError('Tidak dapat mengakses kamera. Pastikan izin diberikan atau kamera terhubung.');
            });
    }, []);

    return (
        <div className="flex flex-wrap items-center justify-center min-h-screen bg-gray-100 p-10 min-w-screen">
            {cameraError ? (
                <div className="text-red-500 mb-4">
                    {cameraError}
                </div>
            ) : <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex flex-col items-center m-2 md:m-4">
                    <button onClick={() => router.push('/camera')}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-lg  w-[100px] h-[100px] flex items-center justify-center md:w-[300px] md:h-[300px]"
                    >
                        <IconUserScan className="w-10 h-10 md:w-40 md:h-40" />
                    </button>
                    <h1 className="text-2xl font-bold mb-6 text-center">Mulai</h1>
                </div>
            </motion.div>}

            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex flex-col items-center m-2 md:m-4">
                    <button onClick={() => router.push('/upload')}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-lg  w-[100px] h-[100px] flex items-center justify-center md:w-[300px] md:h-[300px]"
                    >
                        <IconUpload className="w-10 h-10 md:w-40 md:h-40" />
                    </button>
                    <h1 className="text-2xl font-bold mb-6 text-center">upload</h1>
                </div>
            </motion.div>
        </div>
    );
};

export default Start;
