import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

const ButonTake = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [facingMode, setFacingMode] = useState("user"); // Default ke kamera depan
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [photos, setPhotos] = useState([]); // Array untuk menyimpan foto
    const [error, setError] = useState(""); // State untuk menangani kesalahan
    const [loading, setLoading] = useState(false); // State untuk loading
    const router = useRouter();

    useEffect(() => {
        if (isCameraActive) {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [facingMode, isCameraActive]);

    useEffect(() => {
        // Jika jumlah foto mencapai 4, simpan di localStorage dan arahkan ke halaman hasil
        if (photos.length === 4) {
            localStorage.setItem("capturedPhotos", JSON.stringify(photos));
            router.push("/photo-result");
        }
    }, [photos]);

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
                    disabled={error || !isCameraActive || photos.length >= 4}
                >
                    Ambil Foto ({photos.length}/4)
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

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div role="status" className="flex flex-col items-center">
                        <svg aria-hidden="true" className="w-12 h-12 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                        </svg>
                        <span className="sr-only">Loading...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ButonTake;
