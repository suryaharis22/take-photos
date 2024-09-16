import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import axios from 'axios';
import Swal from 'sweetalert2';
import Webcam from 'react-webcam';

const CameraPage = () => {
  const router = useRouter();
  const webcamRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');

  useEffect(() => {
    getDevices();
  }, []);

  useEffect(() => {
    if (selectedCamera) {
      startVideo(selectedCamera);
    }
    return () => stopStream();
  }, [selectedCamera]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000); // Set interval to 1000ms for a smoother countdown

      return () => clearInterval(timer);
    } else if (countdown === 0) {
      capturePhoto();
    }
  }, [countdown]);

  const getDevices = async () => {
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

  const selectPreferredCamera = (devices) => {
    const rearCamera = devices.find(device => device.label.toLowerCase().includes('rear'));
    const frontCamera = devices.find(device => device.label.toLowerCase().includes('front')) || devices[0];
    return rearCamera ? rearCamera.deviceId : frontCamera.deviceId;
  };

  const startVideo = (deviceId) => {
    if (webcamRef.current) {
      webcamRef.current.getScreenshot(); // Clear the previous screenshot
    }
    setCountdown(3); // Start countdown
  };

  const stopStream = () => {
    if (webcamRef.current) {
      webcamRef.current.video.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return handleError('Gagal menangkap foto.');
      savePhoto(imageSrc);
    } else {
      handleError('Webcam belum siap. Coba lagi.');
    }
  };

  const savePhoto = (photoURL) => {
    const photoCount = 4;
    const dataPhoto = new FormData();

    const uploadPromises = [];
    for (let i = 0; i < photoCount; i++) {
      const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`; // Create unique file name
      const uploadPromise = fetch(photoURL)
        .then(res => res.blob())
        .then(blob => {
          dataPhoto.append('image', blob, uniqueName); // Append each file to 'images' field
        });

      uploadPromises.push(uploadPromise);
    }

    Promise.all(uploadPromises)
      .then(() => {
        axios.post(`${process.env.NEXT_PUBLIC_API_URL_NGROK}upload_compare`, dataPhoto, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          maxBodyLength: Infinity
        })
          .then(response => {
            setLoading(true);

            axios.post(`${process.env.NEXT_PUBLIC_API_URL_NGROK}trigger_training`, {
              trigger: true
            })
              .then(() => {
                setLoading(false);
                router.push('/photo-result');
              })
              .catch(error => {
                handleProcessingError();
              });
          })
          .catch(error => {
            handleProcessingError();
          });
      })
      .catch(error => {
        handleError('Gagal mendeteksi wajah. Silahkan coba lagi.');
      });
  };

  const handleProcessingError = () => {
    setLoading(false);
    Swal.fire({
      icon: 'error',
      title: 'Gagal diproses. Silahkan coba lagi.',
      showConfirmButton: true,
      confirmButtonText: 'Scan again',
      confirmButtonColor: '#3b82f5',
      showCancelButton: true,
      cancelButtonText: 'Back to home',
      cancelButtonColor: '#ef4444',
    }).then((result) => {
      if (result.isConfirmed) {
        setCountdown(3);
      } else {
        router.push('/');
      }
    });
  };

  const handleError = (message) => {
    setError(message);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Ambil Foto</h1>
      <div className="relative flex flex-col items-center justify-center">
        {error ? (
          <div className="text-red-500 mb-4 text-center">
            <p>{error}</p>
            <button
              onClick={() => startVideo(selectedCamera)}
              className="mt-4 bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition duration-300"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
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
                className="absolute text-white text-6xl font-bold"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {countdown}
              </motion.div>
            )}
          </>
        )}
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
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
          </div>
        </div>
      )}
    </div>

  );
};

export default CameraPage;
