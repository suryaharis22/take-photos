// src/pages/face-detection.jsx
import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@tensorflow-models/facemesh";
import Webcam from "react-webcam";
import { useEffect, useRef, useState } from "react";
import { drawMesh } from "@/utils/Points-face";
import { base64ToBlob } from "@/utils/base64ToBlob";
import { generateFileName } from "@/utils/generateFileName";
import axios from "axios";
import { triggerTraining } from "@/utils/trigerTrening";
import { useRouter } from "next/router";
import Swal from "sweetalert2";

function App() {
    const router = useRouter();
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [dataFace, setDataFace] = useState();
    const [images, setImages] = useState([]);
    const [isMobileDevice, setIsMobileDevice] = useState(false);
    const [loading, setLoading] = useState(false);

    const [centerPosition, setCenterPosition] = useState(false);
    const [leftPosition, setLeftPosition] = useState(false);
    const [rightPosition, setRightPosition] = useState(false);
    const [obliqueLeftPosition, setObliqueLeftPosition] = useState(false);
    const [obliqueRightPosition, setObliqueRightPosition] = useState(false);

    const captureImage = () => {
        const canvas = canvasRef.current;
        const video = webcamRef.current.video;
        if (!canvas || !video) return console.error("Failed to capture photo.");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");
        if (!context) return console.error("Failed to get canvas context.");

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const image = canvas.toDataURL("image/png");
        setImages((prevImages) => [...prevImages, image]);
    };

    useEffect(() => {
        if (dataFace) {
            const leftCheekZ = Math.round(dataFace[0]?.annotations?.leftCheek[0][2]);

            if (dataFace[0]?.faceInViewConfidence >= 0.9) {
                if (!centerPosition && leftCheekZ >= -3 && leftCheekZ <= 3) {
                    setCenterPosition(true);
                    captureImage();
                }

                if (!leftPosition && leftCheekZ >= 20 && leftCheekZ <= 25) {
                    setLeftPosition(true);
                    captureImage();
                }

                if (!rightPosition && leftCheekZ >= -25 && leftCheekZ <= -20) {
                    setRightPosition(true);
                    captureImage();
                }

                if (!obliqueLeftPosition && leftCheekZ > 5 && leftCheekZ < 20) {
                    setObliqueLeftPosition(true);
                    captureImage();
                }

                if (!obliqueRightPosition && leftCheekZ < -5 && leftCheekZ > -20) {
                    setObliqueRightPosition(true);
                    captureImage();
                }
            } else {
                console.log("Lighting might be poor or face detection is unclear");
            }
        }
    }, [
        dataFace,
        centerPosition,
        leftPosition,
        rightPosition,
        obliqueLeftPosition,
        obliqueRightPosition,
    ]);

    useEffect(() => {
        console.log(images);

        const uploadImages = async () => {
            if (images.length === 5) {
                setLoading(true);
                const formData = new FormData();

                images.forEach((image, index) => {
                    const imageBlob = base64ToBlob(image, "image/jpeg");
                    const fileName = generateFileName(index);
                    formData.append("image", imageBlob, fileName);
                });

                axios
                    .post(
                        `${process.env.NEXT_PUBLIC_API_URL_NGROK}upload_compare`,
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        }
                    )
                    .then((res) => {
                        console.log("Upload successful", res.data);
                        triggerTraining(router);
                        setImages([]);
                    })
                    .catch((err) => {
                        Swal.fire({
                            icon: "error",
                            title: "Gagal diproses. Silahkan coba lagi.",
                            text: `Error: ${err.response.data.error}`,
                            showConfirmButton: true,
                            confirmButtonText: "Scan again",
                            confirmButtonColor: "#3b82f5",
                            showCancelButton: true,
                            cancelButtonText: "Back to home",
                            cancelButtonColor: "#ef4444",
                        }).then((result) => {
                            if (result.isConfirmed) {
                                uploadImages();
                            } else if (result.isDismissed) {
                                router.push("/");
                            }
                        });
                        setLoading(false);
                        setImages([]);
                    });
            }
        };

        uploadImages();
    }, [images, router]);

    const runFacemesh = async () => {
        const net = await facemesh.load({
            inputResolution: isMobileDevice
                ? { width: 360, height: 640 }
                : { width: 540, height: 480 },
            scale: 0.8,
        });

        const detect = async () => {
            if (webcamRef.current && webcamRef.current.video.readyState === 4) {
                const video = webcamRef.current.video;
                const videoWidth = webcamRef.current.video.videoWidth;
                const videoHeight = webcamRef.current.video.videoHeight;

                webcamRef.current.video.width = videoWidth;
                webcamRef.current.video.height = videoHeight;

                const canvas = canvasRef.current;
                if (!canvas) return console.error("Failed to get canvas reference.");

                canvas.width = videoWidth;
                canvas.height = videoHeight;

                const ctx = canvas.getContext("2d");
                if (!ctx) return console.error("Failed to get canvas context.");

                const face = await net.estimateFaces(video);
                setDataFace(face);

                drawMesh(face, ctx);
            }
            requestAnimationFrame(detect);
        };

        detect();
    };

    useEffect(() => {
        runFacemesh();
    }, [isMobileDevice]);

    useEffect(() => {
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        setIsMobileDevice(isMobile);
    }, []);

    const getInstructionText = () => {
        if (!dataFace || !dataFace[0]) return "Silakan posisi wajah Anda di depan kamera.";

        if (!centerPosition) return "Posisikan wajah Anda di tengah.";
        if (!leftPosition) return "Posisikan wajah Anda di sisi kiri.";
        if (!rightPosition) return "Posisikan wajah Anda di sisi kanan.";
        // if (!obliqueLeftPosition) return "Posisikan wajah Anda di sudut kiri.";
        // if (!obliqueRightPosition) return "Posisikan wajah Anda di sudut kanan.";

        return "Semua posisi telah terdeteksi. Terima kasih!";
    };

    return (
        <div className="relative flex flex-col items-center min-h-screen p-4 bg-gray-900">
            <div className="relative w-full max-w-4xl h-[500px] bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <Webcam
                    ref={webcamRef}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                />
                {/* Instruction Message */}
                <div className="absolute top-4 left-0 right-0 text-center text-white text-xl bg-black bg-opacity-50 p-2 rounded-lg">
                    {getInstructionText()}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div role="status" className="flex flex-col items-center p-4 bg-white rounded-lg shadow-lg">
                        <svg
                            aria-hidden="true"
                            className="w-16 h-16 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.09091 50.5908C9.09091 73.8555 26.7354 91.5 50 91.5C73.2646 91.5 90.9091 73.8555 90.9091 50.5908C90.9091 27.3261 73.2646 9.68164 50 9.68164C26.7354 9.68164 9.09091 27.3261 9.09091 50.5908ZM50 68.5908C47.4839 68.5908 45.1905 66.2974 45.1905 63.5908V36.5908C45.1905 33.8842 47.4839 31.5908 50 31.5908C52.5161 31.5908 54.8095 33.8842 54.8095 36.5908V63.5908C54.8095 66.2974 52.5161 68.5908 50 68.5908Z"
                                fill="currentColor"
                            />
                        </svg>
                        <p className="mt-4 text-gray-900">Loading...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
