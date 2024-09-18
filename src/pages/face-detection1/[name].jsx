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
            for (let i = 0; i < 4; i++) {
                capturePhoto();
            }
        } else {
            console.log("Wajah tidak terdeteksi");
        }
    }, [faceInFrame, distanceValid, angleValid]);

    useEffect(() => {
        if (images.length === 4) {
            convertAndSendImages();
        }
    }, [images]);


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
    const convertAndSendImages = async () => {
        if (!Array.isArray(images)) {
            console.error("Images is not an array");
            return;
        }

        let dataPhoto = new FormData();
        images.forEach((base64Image, index) => {
            const binaryString = atob(base64Image.split(',')[1]);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'image/jpeg' });
            const uniqueName = `${Date.now()}${Math.floor(Math.random() * 10000)}.jpg`;
            dataPhoto.append('image', blob, uniqueName);
        });

        setTimeout(async () => {
            try {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL_NGROK}upload_compare`, dataPhoto, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        name: NameUser,
                    }
                });

                // Tunggu hingga triggerTraining selesai
                await triggerTraining(router);

            } catch (error) {
                console.error("Error uploading photos:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Mengunggah Foto',
                    text: 'Silahkan dicoba lagi.',
                    confirmButtonText: 'Coba Lagi',
                    timer: 3000
                });
            }
        }, 1000);
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
            } else {
                console.warn("Canvas element not available.");
            }
        }
    };


    useEffect(() => {
        runFacemesh();
    }, []);

    return (
        <div className="App">
            <p>Posisi wajah: {faceInFrame ? 'didalam kotak true' : 'Di luar kotak'}</p>
            <p>Jarak wajah: {distanceValid ? 'true (35cm-40cm)' : 'Tidak valid'}</p>
            <p>Sudut wajah: {angleValid ? 'Sejajar true' : 'Tidak sejajar'}</p>
            <header className="App-header">
                <Webcam
                    ref={webcamRef}
                    mirrored={true} // Mengaktifkan mirror mode
                    style={{
                        position: 'absolute',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        zIndex: 9,
                        width: 640,
                        height: 480,
                    }}
                />

                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        zIndex: 9,
                        width: 640,
                        height: 480,
                    }}
                > </canvas>
            </header>
        </div>
    );
}

export default App;
