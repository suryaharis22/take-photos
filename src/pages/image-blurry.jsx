import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Swal from 'sweetalert2';
import Webcam from 'react-webcam';
import Loading from '@/components/Loading';
import { motion } from 'framer-motion';

const CameraPage = () => {
    const router = useRouter();
    const webcamRef = useRef(null);
    const canvasRef = useRef(null); // Ref untuk canvas
    const [videoSrc, setVideoSrc] = useState(null);
    const [countdown, setCountdown] = useState(3); // Mulai dengan countdown 3 detik
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        startVideo();
        return () => stopStream();
    }, []);

    const startVideo = async () => {
        setVideoSrc(null); // Reset video source
        if (webcamRef.current) {
            webcamRef.current.getScreenshot(); // Clear the previous screenshot
        }
        startCountdown(3); // Reset countdown
    };

    const stopStream = () => {
        if (webcamRef.current) {
            webcamRef.current.video.srcObject = null;
            startCountdown(3);
        }
    };

    const startCountdown = (duration) => {
        setCountdown(duration);
        let timeRemaining = duration;
        const interval = setInterval(() => {
            setCountdown(timeRemaining--);
            if (timeRemaining < 0) {
                clearInterval(interval);
                capturePhoto(); // Lakukan pengecekan setelah countdown selesai
            }
        }, 1000);
    };

    const isImageBright = (imageData) => {
        const { data, width, height } = imageData;
        let sum = 0;
        let count = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const offset = (y * width + x) * 4;
                const r = data[offset];
                const g = data[offset + 1];
                const b = data[offset + 2];
                const brightness = (r + g + b) / 3;
                sum += brightness;
                count++;
            }
        }

        const averageBrightness = sum / count;
        console.log(averageBrightness);
        return averageBrightness > 130; // Threshold kecerahan, sesuaikan jika perlu
    };

    const capturePhoto = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error("Canvas belum dirender.");
            return;
        }

        const context = canvas.getContext('2d');
        const video = webcamRef.current.video;

        if (video && canvas) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const isBright = isImageBright(imageData);

            if (isBright) {
                const imageSrc = webcamRef.current.getScreenshot();
                console.log('Gambar diambil:', imageSrc);
                setMessage('Pencahayaan cukup terang, gambar diambil.');
                savePhoto(imageSrc); // Panggil fungsi penyimpanan gambar
            } else {
                setMessage('Pencahayaan kurang terang, harap tambahkan pencahayaan.');
                startCountdown(3); // Mulai kembali countdown jika pencahayaan kurang
            }
        }
    };

    const savePhoto = (photoURL) => {
        const dataPhoto = new FormData();
        const uniqueName = `${Date.now()}${Math.floor(Math.random() * 10000)}.jpg`;

        fetch(photoURL)
            .then((res) => res.blob())
            .then((blob) => {
                dataPhoto.append('image', blob, uniqueName);

                axios
                    .post(`${process.env.NEXT_PUBLIC_API_URL_NGROK}upload_compare`, dataPhoto, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                        maxBodyLength: Infinity,
                    })
                    .then((response) => {
                        setLoading(true);

                        axios
                            .post(`${process.env.NEXT_PUBLIC_API_URL_NGROK}trigger_training`, {
                                trigger: true,
                            })
                            .then(() => {
                                setLoading(false);
                                router.push('/photo-result');
                            })
                            .catch((error) => {
                                setLoading(false);
                                console.error('Error triggering training:', error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Gagal diproses',
                                    text: 'Silahkan coba lagi.',
                                    showConfirmButton: true,
                                    confirmButtonText: 'Scan again',
                                    confirmButtonColor: '#3b82f5',
                                    showCancelButton: true,
                                    cancelButtonText: 'Back to home',
                                    cancelButtonColor: '#ef4444',
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        startCountdown(3);
                                    } else {
                                        router.push('/');
                                    }
                                });
                            });
                    })
                    .catch((error) => {
                        console.error('Error uploading photos:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Gagal Mengunggah Foto',
                            text: 'Silahkan dicoba lagi.',
                            timer: 3000,
                            showConfirmButton: false,
                        }).then(() => {
                            startCountdown(3);
                        });
                    });
            })
            .catch((error) => {
                console.error('Error fetching photo:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Mengambil Foto',
                    text: 'Silahkan dicoba lagi.',
                    confirmButtonText: 'Coba Lagi',
                    timer: 3000,
                }).then(() => {
                    startCountdown(3);
                });
            });
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl md:text-4xl font-bold mb-6 text-center">Ambil Foto</h1>
            <div className="relative flex flex-col items-center justify-center">
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    mirrored={true}
                    className="w-full max-w-md rounded-lg shadow-lg"
                />
                {countdown > 0 && (
                    <motion.div
                        className="absolute text-white text-6xl md:text-8xl font-bold"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    >
                        {countdown}
                    </motion.div>
                )}
                {/* Tambahkan canvas di sini */}
                <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    className="hidden" // Menyembunyikan canvas dari tampilan
                ></canvas>
            </div>

            {/* Tambahkan elemen <p> untuk menampilkan pesan */}
            {message && (
                <p className="text-red-500 text-center mt-4">{message}</p>
            )}

            {loading && <Loading />}
        </div>

    );
};

export default CameraPage;
