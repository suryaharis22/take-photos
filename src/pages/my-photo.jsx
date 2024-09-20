import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Watermark from '@/components/Watermark';
import { motion } from "framer-motion";
import { IconDownload, IconHome } from '@tabler/icons-react';

const MyPhoto = () => {
    const router = useRouter();
    const [images, setImages] = useState([]);
    const [infoPayment, setInfoPayment] = useState(null); // Atur ke null secara default
    const [loading, setLoading] = useState(true); // Tambahkan state loading


    useEffect(() => {
        const fetchData = () => {
            // Mendapatkan data dari sessionStorage
            const storedImages = sessionStorage.getItem('selectedImages');
            const storedPaymentInfo = sessionStorage.getItem('paymentInfo');

            // Mengubah data dari string JSON menjadi objek JavaScript
            if (storedImages) {
                try {
                    const parsedImages = JSON.parse(storedImages);
                    if (Array.isArray(parsedImages)) {
                        setImages(parsedImages);
                    }
                } catch (error) {
                    console.error("Error parsing stored images:", error);
                }
            }

            if (storedPaymentInfo) {
                try {
                    const parsedPaymentInfo = JSON.parse(storedPaymentInfo);
                    if (parsedPaymentInfo?.status === 'success') {
                        setInfoPayment(parsedPaymentInfo);
                    } else {
                        // Jika status pembayaran tidak 'success', redirect
                        // router.push('/photo-result');
                        // sessionStorage.clear();
                    }
                } catch (error) {
                    console.error("Error parsing payment info:", error);
                    // sessionStorage.clear();
                    // router.push('/photo-result');
                }
            } else {
                // Jika tidak ada paymentInfo, redirect
                // router.push('/photo-result');
            }

            // Setelah data di-load, matikan loading
            setLoading(false);
        };

        fetchData();
    }, [router]);

    // Jika masih dalam proses loading, tampilkan indikator loading
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    const handleDownload = () => {
        if (images.length === 0) {
            alert('No images to download.');
            return;
        }

        images.forEach((photo, index) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = `${process.env.NEXT_PUBLIC_API_URL_OMTRI}images/${photo}`;
                link.download = photo; // Nama file yang akan diunduh
                link.style.display = 'none'; // Sembunyikan link dari tampilan
                document.body.appendChild(link);
                link.click(); // Klik link untuk memulai unduhan
                document.body.removeChild(link); // Hapus link setelah unduhan dimulai
            }, index * 500); // Beri jeda 500ms antara setiap unduhan
        });
    };


    return (
        <div className="container mx-auto p-4">
            {/* Header dengan tombol Home dan Download */}
            <div className="flex justify-between items-center mb-8">
                {/* Tombol Home */}
                <motion.button
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    onClick={() => router.push("/")}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-lg"
                >
                    <IconHome className="w-10 h-10" />
                </motion.button>
                <motion.button
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    onClick={handleDownload}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-lg"
                >
                    <IconDownload className="w-10 h-10" />
                </motion.button>
            </div>

            {/* Kontainer untuk card images */}
            {images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto h-screen">
                    {images.map((photo, index) => (
                        <div
                            key={index}
                            className="relative w-40 h-40 bg-white shadow-md rounded-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105 focus-within:scale-105"
                        >
                            <img
                                src={`${process.env.NEXT_PUBLIC_API_URL_OMTRI}images/${photo}`}
                                alt={`${process.env.NEXT_PUBLIC_API_URL_OMTRI}images/${photo}`}
                                className="w-full h-full object-cover"
                            />
                            {/* {infoPayment?.status === 'success' ? (
                                <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL_NGROK}matched_image/${photo}`}
                                    alt={`Photo ${index + 1}`}
                                    className="w-80 object-cover"
                                />
                            ) : (
                                <Watermark imageUrl={`${process.env.NEXT_PUBLIC_API_URL_NGROK}matched_image/${photo}`} />
                            )} */}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex justify-center items-center h-full">
                    <p className="text-gray-400 text-lg">No images. Please scan again</p>
                </div>
            )}
        </div>
    );
};

export default MyPhoto;
