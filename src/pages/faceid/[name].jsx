// src/pages/face-detection.jsx
import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@tensorflow-models/facemesh";
import Webcam from "react-webcam";
import { useEffect, useRef, useState } from "react";
import { drawMesh } from "@/utils/Points-face";
import Swal from "sweetalert2";
import axios from "axios";
import { useRouter } from "next/router";
import { triggerTraining } from "@/utils/trigerTrening";
import Loading from "@/components/Loading";

function App() {
    const router = useRouter();
    const NameUser = router.query.name;

    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [dataFace, setDataFace] = useState();
    const [faceInFrame, setFaceInFrame] = useState(false);
    const [distanceValid, setDistanceValid] = useState(false);
    const [angleValid, setAngleValid] = useState(false);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (dataFace) {
            const bottomRight = dataFace[0]?.boundingBox?.bottomRight;
            const topLeft = dataFace[0]?.boundingBox?.topLeft;

            if (bottomRight && topLeft) {
                // Menghitung jarak Euclidean antara bottomRight dan topLeft
                const distance = Math.sqrt(
                    Math.pow(bottomRight[0] - topLeft[0], 2) +
                    Math.pow(bottomRight[1] - topLeft[1], 2)
                );

                const distanceFace = Math.round(distance);

                // Validasi jarak antara 10cm hingga 15cm
                if (distanceFace >= 400 && distanceFace <= 500) {
                    setDistanceValid(true);
                } else {
                    setDistanceValid(false);
                }
            }

            const noseTipZ = Math.round(dataFace[0]?.annotations?.noseTip[0][2]);
            const leftCheekZ = Math.round(dataFace[0]?.annotations?.leftCheek[0][2]);
            const rightCheekZ = Math.round(dataFace[0]?.annotations?.rightCheek[0][2]);

            // Cek apakah wajah sejajar (perbandingan antara pipi kiri dan kanan)
            const cheekDifference = Math.abs(leftCheekZ - rightCheekZ);
            if (cheekDifference <= 3) {
                setAngleValid(true);
            } else {
                setAngleValid(false);
            }

            const boxWidth = 200;
            const boxHeight = 200;
            const canvasWidth = canvasRef.current.width;
            const canvasHeight = canvasRef.current.height;

            const boxX = (canvasWidth - boxWidth) / 2;
            const boxY = (canvasHeight - boxHeight) / 2;

            const noseTipX = canvasWidth - Math.round(dataFace[0]?.annotations?.noseTip[0][0]);
            const noseTipY = Math.round(dataFace[0]?.annotations?.noseTip[0][1]);

            if (
                noseTipX > boxX &&
                noseTipX < boxX + boxWidth &&
                noseTipY > boxY &&
                noseTipY < boxY + boxHeight
            ) {
                setFaceInFrame(true);
            } else {
                setFaceInFrame(false);
            }
        }
    }, [dataFace]);

    useEffect(() => {
        if (faceInFrame && distanceValid && angleValid && images.length === 0) {
            // Loop untuk menangkap foto sebanyak 4 kali tanpa jeda
            capturePhoto();
            setLoading(true);

        }
    }, [faceInFrame, distanceValid, angleValid]);

    const capturePhoto = () => {
        if (webcamRef.current && webcamRef.current.getScreenshot) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Mengambil Gambar',
                    text: 'Silahkan dicoba kembali.',
                    confirmButtonText: 'Coba Lagi',
                    timer: 3000
                }).then(() => {
                    router.push('/');
                });
            } else {
                setImages((prevImages) => [...prevImages, imageSrc]);


            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Webcam tidak tersedia',
                text: 'Silahkan periksa perangkat webcam Anda.',
                confirmButtonText: 'Coba Lagi',
                confirmButtonColor: '#3085d6',
                showConfirmButton: true,
                cancelButtonColor: '#ef4444',
            }).then(() => {
                runFacemesh();
            });

        };
    }

    useEffect(() => {
        if (images.length > 0) {
            // Using the first image from the array
            uploadFile(images[0]); // Process the first image in the array
        }
    }, [images]);

    const uploadFile = async (base64Image) => {
        // base64Image is a valid string
        if (typeof base64Image !== 'string') {
            console.error('Provided image is not a valid Base64 string.');
            return;
        }

        // Convert Base64 to binary (Blob)
        const binaryString = atob(base64Image.split(',')[1]);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);


        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Create a Blob from the binary data
        const blob = new Blob([bytes], { type: 'image/jpeg' });  // Use the appropriate MIME type
        const uniqueName = `${Date.now()}${Math.floor(Math.random() * 10000)}.jpeg`;

        let formData = new FormData();
        formData.append('name', NameUser);  // Add name field
        formData.append('image', blob, uniqueName);

        try {
            // Endpoint untuk meng-upload
            const response = await axios.post('https://faceid2.panorasnap.com/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            let urlImage = response?.data?.redirect_url;



            if (response.status === 200) {
                urlImage = urlImage.replace('matches?matches=', '');
                Swal.fire({
                    icon: 'success',
                    title: 'Upload Berhasil',
                    text: 'Data Berhasil',
                    showConfirmButton: false,
                    timer: 1500
                })
                    .then(() => {
                        setLoading(false);
                        setImages([]);
                        router.push(`/photo-result2?matches=${urlImage}`);
                    })
            }

        } catch (error) {
            setLoading(false);
            setImages([]);
            console.error('Error uploading file:', error);
            throw error;
        }
    };


    const runFacemesh = async () => {
        const net = await facemesh.load({
            inputResolution: { width: 640, height: 480 }, scale: 0.8
        });
        setInterval(() => {
            detect(net);
        }, 100);
    }

    const detect = async (net) => {
        if (
            typeof webcamRef.current !== "undefined" &&
            webcamRef.current !== null &&
            webcamRef.current.video.readyState === 4
        ) {
            const video = webcamRef.current.video;
            const videoWidth = webcamRef.current.video.videoWidth;
            const videoHeight = webcamRef.current.video.videoHeight;

            webcamRef.current.video.width = videoWidth;
            webcamRef.current.video.height = videoHeight;

            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;

            const face = await net.estimateFaces(video);

            // Membalik koordinat X untuk setiap titik deteksi karena webcam dalam mode mirrored
            const mirroredFace = face.map(f => {
                return {
                    ...f,
                    scaledMesh: f.scaledMesh.map(point => {
                        const [x, y, z] = point;
                        return [videoWidth - x, y, z]; // Balik koordinat X
                    }),
                    annotations: Object.keys(f.annotations).reduce((acc, key) => {
                        acc[key] = f.annotations[key].map(point => {
                            const [x, y, z] = point;
                            return [videoWidth - x, y, z]; // Balik koordinat X
                        });
                        return acc;
                    }, {})
                };
            });

            setDataFace(mirroredFace);

            // Pastikan canvasRef sudah terisi
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext("2d");
                ctx.clearRect(0, 0, videoWidth, videoHeight);

                // Gambar kotak di tengah canvas
                const boxWidth = 100;
                const boxHeight = 100;
                const boxX = (videoWidth - boxWidth) / 2;
                const boxY = (videoHeight - boxHeight) / 2;
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0)';  // Membuat kotak transparan
                ctx.rect(boxX, boxY, boxWidth, boxHeight);
                ctx.stroke();
            }
        }
    };


    useEffect(() => {
        runFacemesh();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">


            {loading ? (
                <Loading />
            ) : (<div className="relative w-full max-w-md">
                {!faceInFrame && (
                    <p style={{ zIndex: 7, }} className="text-sm font-semibold text-red-500 absolute top-0 left-50 right-50">Posisi kan Wajah ditengah kotak</p>
                )}
                {!distanceValid && (
                    <p style={{ zIndex: 7, }} className="text-sm font-semibold text-red-500 absolute top-4 left-50 right-50">Jarak antar Kamer terlalu jauh/dekat</p>

                )}
                {!angleValid && (
                    <p style={{ zIndex: 7, }} className="text-sm font-semibold text-red-500 absolute top-8 left-50 right-50">Sudut wajah: Tidak sejajar</p>

                )}

                <Webcam
                    ref={webcamRef}
                    mirrored={true}
                    className="rounded-lg shadow-md w-full"
                    style={{
                        position: 'relative',
                        zIndex: 6,
                    }}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    style={{
                        zIndex: 5,
                    }}
                />
                {!dataFace && (
                    <div
                        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center p-4 font-bold bg-black  w-full h-full rounded-lg "
                        style={{
                            zIndex: 7,
                        }}>

                        <img src="/loading.gif" alt="Loading..." className="opacity-100" width={250} height={250} />
                    </div>
                )}
            </div>
            )}
        </div>
    );
}

export default App;
