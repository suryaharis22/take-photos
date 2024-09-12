import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

const CameraPage = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [facingMode, setFacingMode] = useState("user");
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [countdown, setCountdown] = useState(5);
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    const router = useRouter();
    const countdownRef = useRef(null);

    useEffect(() => {
        const storedPhotos = JSON.parse(localStorage.getItem("capturedPhotos")) || [];
        setCapturedPhotos(storedPhotos);

        if (isCameraActive) {
            startCamera();
            startCountdown();
        }
        return () => {
            stopCamera();
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, [facingMode, isCameraActive]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode },
            });
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        } catch (err) {
            console.error("Kamera tidak tersedia: ", err);
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const startCountdown = async () => {
        setCountdown(5);
        countdownRef.current = setInterval(async () => {
            setCountdown((prev) => {
                if (prev === 1) {
                    clearInterval(countdownRef.current);
                    countdownRef.current = null;
                    capturePhoto();
                }
                return prev - 1;
            });
        }, 1000);
    };

    const capturePhoto = async () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photo = canvas.toDataURL("image/jpeg");

        const updatedPhotos = [...capturedPhotos, photo];
        setCapturedPhotos(updatedPhotos);
        localStorage.setItem("capturedPhotos", JSON.stringify(updatedPhotos));

        if (updatedPhotos.length >= 4) {
            router.push("/photo-result");
        } else {
            startCountdown();
        }
    };

    const switchCamera = () => {
        setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
        stopCamera();
        startCamera();
    };
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <h1 className="text-2xl font-bold mb-6 text-center">Ambil Foto dari Kamera</h1>
            <div className="relative w-full max-w-md">
                <video
                    ref={videoRef}
                    className="w-full bg-black"
                    playsInline
                    autoPlay
                    muted
                ></video>

                {capturedPhotos.length < 4 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-6xl font-bold">{countdown}</span>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden"></canvas>

            <div className="mt-4 flex space-x-4">
                <button
                    onClick={switchCamera}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                >
                    Ganti Kamera ({facingMode === "user" ? "Depan" : "Belakang"})
                </button>

                {isCameraActive ? (
                    <button
                        onClick={() => setIsCameraActive(false)}
                        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
                    >
                        Matikan Kamera
                    </button>
                ) : (
                    <button
                        onClick={() => setIsCameraActive(true)}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Aktifkan Kamera
                    </button>
                )}
            </div>
        </div>
    );
};

export default CameraPage;
