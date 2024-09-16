import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import axios from 'axios';
import Swal from 'sweetalert2';
import Webcam from 'react-webcam';
import Loading from '@/components/Loading';

const CameraPage = () => {
  const router = useRouter();
  const webcamRef = useRef(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length === 0) {
          setError('Tidak ada perangkat kamera yang tersedia.');
          return;
        }
        setCameraDevices(videoDevices);
        setSelectedCamera(selectPreferredCamera(videoDevices));
      } catch (err) {
        handleError('Tidak dapat mengakses perangkat kamera. Pastikan perangkat kamera terhubung dengan benar.');
      }
    };
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedCamera) {
      startVideo(selectedCamera);
    }
    return () => stopStream();
  }, [selectedCamera]);

  const selectPreferredCamera = (devices) => {
    const rearCamera = devices.find(device => device.label.toLowerCase().includes('rear'));
    const frontCamera = devices.find(device => device.label.toLowerCase().includes('front')) || devices[0];
    return rearCamera ? rearCamera.deviceId : frontCamera.deviceId;
  };

  const startVideo = (deviceId) => {
    if (webcamRef.current) {
      webcamRef.current.getScreenshot(); // Clear previous screenshot
    }
    startCountdown(3);
  };

  const stopStream = () => {
    if (webcamRef.current) {
      webcamRef.current.video.srcObject = null;
    }
  };

  const startCountdown = (duration) => {
    let timeRemaining = duration;
    setCountdown(timeRemaining);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          capturePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const capturePhoto = () => {
    if (!webcamRef.current) return handleError('Webcam belum siap.');
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return handleError('Gagal menangkap foto.');
    savePhoto(imageSrc);
  };

  const savePhoto = async (photoURL) => {
    const photoCount = 4;
    const dataPhoto = new FormData();

    try {
      for (let i = 0; i < photoCount; i++) {
        const uniqueName = `${Date.now()}${Math.floor(Math.random() * 10000)}.jpg`;
        const response = await fetch(photoURL);
        const blob = await response.blob();
        dataPhoto.append('image', blob, uniqueName);
      }

      setLoading(true);
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL_NGROK}upload_compare`, dataPhoto, {
        headers: { 'Content-Type': 'multipart/form-data' },
        maxBodyLength: Infinity
      });


      await axios.post(`${process.env.NEXT_PUBLIC_API_URL_NGROK}trigger_training`, { trigger: true });
      router.push('/photo-result');
    } catch (error) {
      handleError('Gagal diproses. Silahkan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (message) => {
    setError(message);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl md:text-4xl font-bold mb-6 text-center">Ambil Foto</h1>
      <div className="relative flex flex-col items-center justify-center">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          mirrored={true}
          className="w-full max-w-md rounded-lg shadow-lg"
          videoConstraints={{ deviceId: selectedCamera }}
        />
        {countdown > 0 && (
          <motion.div
            className="absolute text-white text-6xl md:text-8xl font-bold"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {countdown}
          </motion.div>
        )}
      </div>
      {loading && <Loading />}
    </div>


  );
};

export default CameraPage;
