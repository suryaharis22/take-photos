import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

const ButonTake = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [facingMode, setFacingMode] = useState("user"); // Default ke kamera depan
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [photos, setPhotos] = useState([]); // Array untuk menyimpan foto
    const [error, setError] = useState(""); // State untuk menangani kesalahan
    const router = useRouter();

    useEffect(() => {
        if (isCameraActive) {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [facingMode, isCameraActive]);

    const startCamera = async () => {
        try {
            setError(""); // Reset error state
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode },
            });
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        } catch (err) {
            console.error("Kamera tidak tersedia: ", err);
            setError("Tidak dapat mengakses kamera. Harap periksa izin aplikasi.");
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

    const handleRetryPermission = async () => {
        setError(""); // Reset error state
        await startCamera(); // Minta izin ulang untuk akses kamera
    };

    const capturePhoto = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photo = canvas.toDataURL("image/jpeg");

        setPhotos((prevPhotos) => [...prevPhotos, photo]);

        // Jika sudah 4 foto, simpan di localStorage dan pindah ke halaman hasil
        if (photos.length + 1 === 4) {
            const updatedPhotos = [...photos, photo];
            localStorage.setItem("capturedPhotos", JSON.stringify(updatedPhotos)); // Simpan foto ke localStorage
            router.push("/photo-result");
        }
    };

    const switchCamera = () => {
        setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <h1 className="text-2xl font-bold mb-6">Ambil Foto dari Kamera</h1>
            {error && (
                <div className="mb-4">
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={handleRetryPermission}
                        className="bg-yellow-500 text-white px-6 py-2 rounded-lg mt-2"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}
            <video ref={videoRef} className="w-full max-w-md bg-black" playsInline autoPlay muted></video>
            <canvas ref={canvasRef} className="hidden"></canvas>

            <div className="mt-4">
                <button
                    onClick={capturePhoto}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg mr-2"
                    disabled={error || !isCameraActive}
                >
                    Ambil Foto ({photos.length + 1}/4)
                </button>
                <button
                    onClick={switchCamera}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg"
                    disabled={error}
                >
                    Ganti Kamera ({facingMode === "user" ? "Depan" : "Belakang"})
                </button>
            </div>

            {isCameraActive ? (
                <button
                    onClick={() => setIsCameraActive(false)}
                    className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg"
                >
                    Matikan Kamera
                </button>
            ) : (
                <button
                    onClick={() => setIsCameraActive(true)}
                    className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg"
                >
                    Aktifkan Kamera
                </button>
            )}
        </div>
    );
};

export default ButonTake;
