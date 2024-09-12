import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import * as faceapi from 'face-api.js';

const getDevicesList = async () => {
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    return mediaDevices.filter(device => device.kind === 'videoinput');
};

const startMediaStream = async (deviceId, facingMode, stream) => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    return await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId ? { exact: deviceId } : undefined, facingMode },
    });
};

const CameraPage = () => {
    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('environment');
    const [error, setError] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const [loading, setLoading] = useState(false);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);  // Canvas untuk deteksi wajah
    const router = useRouter();

    // Fungsi untuk mulai video dan memulai countdown
    const startVideo = useCallback(async () => {
        try {
            const newStream = await startMediaStream(selectedDeviceId, facingMode, stream);
            setStream(newStream);

            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
                videoRef.current.play();
            }

            setError(null);
            startCountdown(3);
        } catch (err) {
            setError('Tidak dapat mengakses kamera. Pastikan izinkan akses kamera di browser.');
        }
    }, [selectedDeviceId, facingMode, stream]);

    // Fungsi untuk memulai countdown
    const startCountdown = useCallback((duration) => {
        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = Math.floor((timestamp - startTime) / 1000);
            const timeLeft = Math.max(duration - elapsed, 0);
            setCountdown(timeLeft);

            if (timeLeft > 0) {
                requestAnimationFrame(step);
            } else {
                capturePhoto();
            }
        };

        requestAnimationFrame(step);
    }, []);

    // Fungsi untuk menangkap foto
    const capturePhoto = useCallback(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (canvas && video) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const photoURL = canvas.toDataURL('image/jpeg');

            localStorage.setItem('capturedPhotos', JSON.stringify([photoURL]));
            setLoading(true);
            setTimeout(() => router.push('/photo-result'), 5000);
        }
    }, [router]);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const videoDevices = await getDevicesList();
                setDevices(videoDevices);
                const defaultDevice = videoDevices.find(device => device.label.includes('back')) || videoDevices[0];
                setSelectedDeviceId(defaultDevice ? defaultDevice.deviceId : '');
            } catch {
                setError('Tidak dapat mengakses perangkat kamera.');
            }
        };

        fetchDevices();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Memulai video saat `selectedDeviceId` atau `facingMode` berubah
    useEffect(() => {
        if (selectedDeviceId) {
            startVideo();
        }
    }, [selectedDeviceId, facingMode, startVideo]);

    // Load Face API models and detect faces
    useEffect(() => {
        const loadModels = async () => {
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        };

        const detectFaces = async () => {
            if (videoRef.current) {
                const video = videoRef.current;

                const displaySize = {
                    width: video.videoWidth,
                    height: video.videoHeight,
                };

                faceapi.matchDimensions(overlayRef.current, displaySize);

                const detection = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceExpressions();

                const resizedDetections = faceapi.resizeResults(detection, displaySize);

                const canvas = overlayRef.current;
                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);

                faceapi.draw.drawDetections(canvas, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            }
        };

        loadModels();
        const interval = setInterval(detectFaces, 100);

        return () => clearInterval(interval);
    }, [stream]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-center">Ambil Foto</h1>
            <div className="relative flex flex-col items-center">
                {error ? (
                    <div className="text-red-500 mb-4 text-center">
                        <p>{error}</p>
                        <button onClick={startVideo} className="mt-4 bg-yellow-500 text-white py-2 px-4 rounded transition-transform duration-300 transform hover:scale-105">
                            Coba Lagi
                        </button>
                    </div>
                ) : (
                    <>
                        <video ref={videoRef} className="border border-gray-400 rounded-lg shadow-lg w-full max-w-md h-auto" autoPlay></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <canvas ref={overlayRef} className="absolute top-0 left-0" />
                        {countdown > 0 && (
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center text-white text-6xl font-bold"
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                {countdown}
                            </motion.div>
                        )}
                    </>
                )}
            </div>
            <div className="mt-4 flex flex-col items-center">
                <select
                    value={selectedDeviceId}
                    onChange={e => setSelectedDeviceId(e.target.value)}
                    className="bg-gray-200 border border-gray-300 rounded p-2 mb-4"
                >
                    {devices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${devices.indexOf(device) + 1}`}
                        </option>
                    ))}
                </select>
                <select
                    value={facingMode}
                    onChange={e => setFacingMode(e.target.value)}
                    className="bg-gray-200 border border-gray-300 rounded p-2 mb-4"
                >
                    <option value="environment">Kamera Belakang</option>
                    <option value="user">Kamera Depan</option>
                </select>
            </div>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div role="status" className="flex flex-col items-center">
                        <svg
                            aria-hidden="true"
                            className="w-16 h-16 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9765 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9765 100 50.5908ZM9.08168 50.5908C9.08168 73.2315 27.3593 91.5092 50 91.5092C72.6407 91.5092 90.9183 73.2315 90.9183 50.5908C90.9183 27.9501 72.6407 9.67248 50 9.67248C27.3593 9.67248 9.08168 27.9501 9.08168 50.5908Z"
                                fill="currentColor"
                            />
                            <path
                                d="M93.9676 39.0409C96.393 38.6781 98.2497 36.3545 97.673 33.9493C96.1921 27.4004 92.8375 21.3692 87.9715 16.819C82.9955 12.1824 76.804 9.133 70.1187 7.99925C63.4334 6.86554 56.5254 7.71939 50.5413 10.0229C45.537 10.7267 40.3173 12.457 35.9524 15.1219C31.5875 17.7867 27.7272 21.3426 24.542 25.639C22.2653 28.6241 20.4649 31.9177 19.1948 35.4296C18.3853 37.6677 16.0928 38.6781 13.6674 39.0409Z"
                                fill="currentFill"
                            />
                        </svg>
                        <span className="text-white mt-2">Memproses Foto...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CameraPage;
