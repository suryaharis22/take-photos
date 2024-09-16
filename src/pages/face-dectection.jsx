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
import { IconHourglassEmpty, IconMoodConfuzed } from "@tabler/icons-react";

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
                ? { width: 360, height: 640 }  // Resolusi untuk perangkat mobile
                : { width: 640, height: 480 }, // Resolusi untuk desktop
            scale: 0.8,
        });

        const detect = async () => {
            if (webcamRef.current && webcamRef.current.video.readyState === 4) {
                const video = webcamRef.current.video;
                const videoWidth = webcamRef.current.video.videoWidth;
                const videoHeight = webcamRef.current.video.videoHeight;

                // Tentukan ukuran video dan canvas sesuai dengan resolusi perangkat
                webcamRef.current.video.width = videoWidth;
                webcamRef.current.video.height = videoHeight;

                const canvas = canvasRef.current;
                if (!canvas) return console.error("Failed to get canvas reference.");

                canvas.width = videoWidth;
                canvas.height = videoHeight;

                const ctx = canvas.getContext("2d");
                if (!ctx) return console.error("Failed to get canvas context.");

                // Atur mode `mirrored` agar sesuai dengan tampilan video
                ctx.translate(videoWidth, 0);  // Pindahkan titik awal ke ujung kanan
                ctx.scale(-1, 1);  // Balikkan gambar secara horizontal (mirrored)

                const face = await net.estimateFaces(video);
                setDataFace(face);

                // Jika diperlukan, Anda bisa mengaktifkan ini untuk menggambar mesh wajah
                drawMesh(face, ctx);

                requestAnimationFrame(detect);
            }
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
        if (!dataFace) return (
            <>
                <p className="mb-10 bg-opacity-50 bg-gray-500 rounded-lg ">please waiting.</p>
                <img src="/loading.gif" alt="Loading..." width={250} height={250} />

            </>
        );
        if (dataFace[0]?.faceInViewConfidence < 1 || !dataFace[0]) {
            return (
                <>
                    <p className="mb-10 bg-opacity-50 bg-gray-500 rounded-lg ">Lighting might be poor or face detection is unclear.</p>
                    {/* <IconMoodConfuzed className="w-6 h-6 text-white" /> */}
                </>
            );
        }

        if (!centerPosition) return (
            <>
                <p className="mb-10 bg-opacity-50 bg-gray-500 rounded-lg animate-pulse">
                    Posisikan wajah Anda di tengah.
                </p>
                <img src="./face_center.png" alt="" className="mt-10 opacity-50 animate-pulse transform transition duration-500 ease-in-out scale-110" />
            </>
        );
        if (!leftPosition) return (
            <>
                <p className="mb-10 bg-opacity-50 bg-gray-500 rounded-lg animate-pulse">
                    Posisikan wajah Anda di sisi kiri.
                </p>
                <img src="./face_left.png" alt="" className="mt-10 opacity-50 animate-pulse transform transition duration-500 ease-in-out scale-110" />
            </>
        );
        if (!rightPosition) return (
            <>
                <p className="mb-10 bg-opacity-50 bg-gray-500 rounded-lg animate-pulse">
                    Posisikan wajah Anda di sisi kanan.
                </p>
                <img src="./face_right.png" alt="" className="mt-10 opacity-50 animate-pulse transform transition duration-500 ease-in-out scale-110" />
            </>
        );
        // if (!obliqueLeftPosition) return "Posisikan wajah Anda di sudut kiri.";
        // if (!obliqueRightPosition) return "Posisikan wajah Anda di sudut kanan.";

        return "Semua posisi telah terdeteksi. Terima kasih!";
    };

    return (
        <div className="relative flex flex-col items-center min-h-screen p-4 bg-white">
            <div className="relative w-full max-w-4xl h-[500px] bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <Webcam
                    ref={webcamRef}
                    mirrored={true}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                />
                {/* Instruction Message */}
                <div className="absolute top-4 left-0 right-0 flex flex-col items-center justify-center p-4 font-bold">
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
