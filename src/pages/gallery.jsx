import Watermark from "@/components/Watermark";
import { IconDownload, IconHome } from "@tabler/icons-react";
import axios from "axios";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

const Gallery = () => {
    const router = useRouter();
    const [pickedItems, setPickedItems] = useState([]);
    const [images, setImages] = useState([]); // Semua gambar dari API
    const [visibleImages, setVisibleImages] = useState([]); // Gambar yang ditampilkan
    const [loading, setLoading] = useState(false);
    const observerRef = useRef(null);
    const [itemsPerPage] = useState(10); // Jumlah item yang ditampilkan setiap kali

    // Fungsi untuk mengambil semua gambar dari API
    const fetchImages = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL_NGROK}get_all_images`);
            const allImages = response.data.all_images;
            setImages(allImages); // Simpan semua gambar
            setVisibleImages(allImages.slice(0, itemsPerPage)); // Tampilkan hanya 10 gambar pertama
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk menambahkan lebih banyak gambar ke tampilan
    const loadMoreImages = () => {
        const currentLength = visibleImages.length;
        const nextImages = images.slice(currentLength, currentLength + itemsPerPage);
        setVisibleImages((prevImages) => [...prevImages, ...nextImages]);
    };

    // Memantau ketika pengguna mencapai bagian bawah halaman untuk memuat lebih banyak data
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && visibleImages.length < images.length) {
                    loadMoreImages();
                }
            },
            { threshold: 1.0 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => {
            if (observerRef.current) {
                observer.unobserve(observerRef.current);
            }
        };
    }, [visibleImages, images]);

    // Ambil gambar saat pertama kali halaman dimuat
    useEffect(() => {
        fetchImages();
    }, []);

    const handlePickItem = (index) => {
        setPickedItems((prevPickedItems) => {
            if (prevPickedItems.includes(index)) {
                return prevPickedItems.filter((item) => item !== index);
            } else {
                return [...prevPickedItems, index];
            }
        });
    };

    return (
        <div className="container mx-auto p-2 h-screen">
            <div className="flex flex-wrap items-end justify-between bg-gray-100 p-2">
                <motion.button
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    onClick={() => router.push("/")}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-lg"
                >
                    <IconHome className="w-10 h-10" />
                </motion.button>
                {pickedItems.length > 0 && (
                    <motion.button
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-lg"
                    >
                        <IconDownload className="w-10 h-10" />
                    </motion.button>
                )}
            </div>
            <div className="flex flex-wrap justify-center h-full bg-gray-100 min-w-screen overflow-auto p-2 pb-20">
                {visibleImages.map((image, index) => (
                    <label
                        key={index}
                        htmlFor={`checkbox-${image}`}
                        className="relative w-44 h-44 bg-blue-500 m-2 rounded-md border-2 border-black"
                    >
                        <input
                            id={`checkbox-${image}`}
                            type="checkbox"
                            className="absolute top-2 left-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            onChange={() => handlePickItem(image)}
                            checked={pickedItems.includes(image)}
                        />
                        <Watermark imageUrl={`${process.env.NEXT_PUBLIC_API_URL_NGROK}all_image/${image}`} />
                    </label>
                ))}
                {/* Infinite scrolling trigger */}
                <div ref={observerRef} className="h-10 w-full"></div>
                {loading && <p className="text-center w-full">Loading...</p>}
            </div>
        </div>
    );
};

export default Gallery;
