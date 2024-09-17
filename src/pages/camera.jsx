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
  const [videoSrc, setVideoSrc] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    startVideo();
    return () => stopStream();
  }, []);

  const startVideo = async () => {
    setVideoSrc(null); // Reset video source
    if (webcamRef.current) {
      webcamRef.current.getScreenshot(); // Clear the previous screenshot
    }
    setCountdown(3); // Reset countdown
  };

  const stopStream = () => {
    // Clear webcam ref
    if (webcamRef.current) {
      webcamRef.current.video.srcObject = null;
      startCountdown(3);
    }
  };

  const startCountdown = (duration) => {
    setCountdown(duration);
    let timeRemaining = duration;
    const interval = setInterval(() => {
      setCountdown(timeRemaining--);
      if (timeRemaining < 0) {
        clearInterval(interval);
        capturePhoto();
      }
    }, 1000);
  };

  const capturePhoto = () => {
    if (webcamRef.current && webcamRef.current.getScreenshot) {
      const imageSrc = webcamRef.current.getScreenshot();
      console.log(imageSrc);

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
        savePhoto(imageSrc);
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
        startCountdown(3);
      });
    }
  };

  const savePhoto = (photoURL) => {
    const photoCount = 4;
    let dataPhoto = new FormData();

    for (let i = 0; i < photoCount; i++) {
      const uniqueName = `${Date.now()}${Math.floor(Math.random() * 10000)}.jpg`; // Create unique file name
      fetch(photoURL)
        .then(res => res.blob())
        .then(blob => {
          dataPhoto.append('image', blob, uniqueName); // Append each file to 'images' field
        })
        .catch(error => {
          console.error("Error fetching photo:", error);
          Swal.fire({
            icon: 'error',
            title: 'Gagal Mengambil Foto',
            text: 'Silahkan dicoba lagi.',
            confirmButtonText: 'Coba Lagi',
            timer: 3000
          }).then(() => {
            startCountdown(3);
          });
        });
    }

    setTimeout(() => {
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
              setLoading(false);
              console.error("Error triggering training:", error);
              Swal.fire({
                icon: 'error',
                title: 'Gagal diproses',
                text: 'Silahkan coba lagi.',
                showConfirmButton: true,
                confirmButtonText: 'Scan again',
                confirmButtonColor: '#3b82f5',
                showCancelButton: true,
                cancelButtonText: 'Back to home',
                cancelButtonColor: '#ef4444',
              }).then((result) => {
                if (result.isConfirmed) {
                  startCountdown(3);
                } else {
                  router.push('/');
                }
              });
            });
        })
        .catch(error => {
          console.error("Error uploading photos:", error);
          Swal.fire({
            icon: 'error',
            title: 'Gagal Mengunggah Foto',
            text: 'Silahkan dicoba lagi.',
            timer: 3000,
            showConfirmButton: false
          }).then(() => {
            startCountdown(3);
          });
        });
    }, 1000);
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
