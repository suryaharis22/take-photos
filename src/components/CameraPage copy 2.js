import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';

const CameraPage = () => {
    const [videoSrc, setVideoSrc] = useState(null);
    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('user'); // 'user' for front, 'environment' for back
    const [error, setError] = useState(null); // State for handling errors
    const [countdown, setCountdown] = useState(0); // State for countdown
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const router = useRouter();

    // Function to start the video stream
    const startVideo = async () => {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
            });
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
                videoRef.current.play();
            }
            setError(null); // Clear any previous errors
        } catch (err) {
            console.error('Error accessing camera: ', err);
            setError('Tidak dapat mengakses kamera. Pastikan kamera diaktifkan dan izinkan akses kamera. Jika akses kamera telah ditolak, Anda mungkin perlu mengatur ulang izin browser.');
        }
    };

    // Function to handle retry permission
    const handleRetry = () => {
        setError(null); // Clear any previous errors
        startVideo(); // Try to start video again
    };

    // Function to start countdown and capture photo
    const startCountdown = () => {
        setCountdown(3); // Set countdown to 3 seconds
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    capturePhoto(); // Capture photo when countdown finishes
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Function to capture a photo and handle redirection
    const capturePhoto = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (canvas && video) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const photoURL = canvas.toDataURL('image/jpeg');
            setVideoSrc(photoURL);

            // Save photo to localStorage
            const existingPhotos = JSON.parse(localStorage.getItem('capturedPhotos')) || [];
            existingPhotos.push(photoURL);
            localStorage.setItem('capturedPhotos', JSON.stringify(existingPhotos));

            // Redirect to photo-result page
            router.push('/photo-result');
        }
    };

    const switchCamera = () => {
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    };

    useEffect(() => {
        startVideo();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-xl font-bold mb-4">Ambil Foto</h1>
            <div className="flex flex-col items-center">
                {error ? (
                    <div className="text-red-500 mb-4 text-center">
                        <p>{error}</p>
                        <button onClick={handleRetry} className="mt-4 bg-yellow-500 text-white py-2 px-4 rounded">
                            Coba Lagi
                        </button>
                    </div>
                ) : (
                    <>
                        <video ref={videoRef} className="border border-gray-400" autoPlay></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <div className="mt-4">
                            {countdown > 0 ? (
                                <p className="text-lg font-semibold">Menunggu: {countdown} detik</p>
                            ) : (
                                <button onClick={startCountdown} className="bg-blue-500 text-white py-2 px-4 rounded">
                                    Ambil Foto Otomatis
                                </button>
                            )}
                        </div>
                        <button onClick={switchCamera} className="mt-2 bg-green-500 text-white py-2 px-4 rounded">
                            Ganti Kamera
                        </button>
                        {videoSrc && (
                            <div className="mt-4">
                                <img src={videoSrc} alt="Captured" className="border border-gray-400" />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CameraPage;
