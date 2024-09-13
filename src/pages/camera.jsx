// src\pages\face-dectection.jsx
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import Webcam from 'react-webcam';
import { useEffect, useRef, useState } from 'react';
import { drawMesh } from '@/utils/Points-face';
import { base64ToBlob } from '@/utils/base64ToBlob';
import { generateFileName } from '@/utils/generateFileName';
import axios from 'axios';
import { triggerTraining } from '@/utils/trigerTrening';
import { useRouter } from 'next/router';

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
    if (!canvas || !video) return console.error('Failed to capture photo.');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) return console.error('Failed to get canvas context.');

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL('image/png');
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
        console.log('Lighting might be poor or face detection is unclear');
      }
    }
  }, [dataFace, centerPosition, leftPosition, rightPosition, obliqueLeftPosition, obliqueRightPosition]);

  useEffect(() => {
    console.log(images);

    const uploadImages = async () => {
      if (images.length === 5) {
        setLoading(true);
        try {
          const formData = new FormData();

          images.forEach((image, index) => {
            const imageBlob = base64ToBlob(image, 'image/jpeg');
            const fileName = generateFileName(index);
            formData.append('image', imageBlob, fileName);
          });

          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL_NGROK}upload_compare`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          console.log('Upload successful', response.data);
          if (response.status === 200) {
            await triggerTraining(router);
          }

        } catch (error) {
          console.error('Error uploading images', error);
        } finally {
          setLoading(false);

          setImages([]);
        }
      }
    };

    uploadImages();
  }, [images, router]);

  const runFacemesh = async () => {
    const net = await facemesh.load({
      inputResolution: isMobileDevice ? { width: 360, height: 640 } : { width: 640, height: 480 },
      scale: 0.8,
    });

    const detect = async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        const canvas = canvasRef.current;
        if (!canvas) return console.error('Failed to get canvas reference.');

        canvas.width = videoWidth;
        canvas.height = videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return console.error('Failed to get canvas context.');

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

  return (
    <div className="relative flex justify-center items-center min-w-screen min-h-screen">
      <div className="absolute top-0 inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div role="status" className="flex flex-col items-center w-[">
          <svg aria-hidden="true" className="w-52 h-50 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
          </svg>
          {/* <span className="sr-only">Loading...</span> */}
        </div>
      </div>

      <div >
        <Webcam
          ref={webcamRef}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
      {/* Loading */}
      {loading && (
        <div className="absolute top-0 inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div role="status" className="flex flex-col items-center w-[">
            <svg aria-hidden="true" className="w-52 h-50 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
            </svg>
            {/* <span className="sr-only">Loading...</span> */}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
