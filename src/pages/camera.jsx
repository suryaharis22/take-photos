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
  const countdownRef = useRef(null); // Menyimpan referensi interval
  const [nama, setNama] = useState('');

  // useEffect(() => {
  //   startVideo();
  //   return () => {
  //     stopStream();
  //     if (countdownRef.current) {
  //       clearInterval(countdownRef.current); // Hentikan countdown jika component unmount
  //     }
  //   };
  // }, []);

  const startVideo = async () => {
    setVideoSrc(null); // Reset video source
    if (webcamRef.current) {
      webcamRef.current.getScreenshot(); // Clear the previous screenshot
    }
    startCountdown(3); // Mulai countdown saat memulai video
  };

  const stopStream = () => {
    if (webcamRef.current) {
      webcamRef.current.video.srcObject = null;
    }
  };

  const startCountdown = (duration) => {
    setCountdown(duration);
    let timeRemaining = duration;

    // Bersihkan interval yang sebelumnya jika ada
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current); // Hentikan interval saat waktu habis
          capturePhoto();
          return null;
        }
        return prev - 1; // Update countdown
      });
    }, 1000);
  };

  const handleNama = (event) => {
    const field = event.target.value;

    const isValid = /^[a-z]+$/.test(field);

    if (isValid || field === "") {
      setNama(field);
    } else {
      console.warn("Hanya huruf kecil yang diperbolehkan!");
    }
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

  const handleSummit = (event) => {
    event.preventDefault();
    if (nama === "") {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengambil Gambar',
        text: 'Silahkan isi Name anda',
        confirmButtonText: 'Coba Lagi',
        timer: 3000
      }).then(() => {
        router.push('/');
      });
    } else {
      startVideo();
      return () => {
        stopStream();
        if (countdownRef.current) {
          clearInterval(countdownRef.current); // Hentikan countdown jika component unmount
        }
      };
    }

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
        <div class="mt-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" htmlFor='nama'>
            Name
          </label>
          <input onChange={handleNama} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="nama" type="text" placeholder="Name" />
        </div>
        <button class="relative inline-flex items-center justify-center p-0.5 mt-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white  focus:ring-4 focus:outline-none focus:ring-blue-300 "
          onClick={handleSummit}
          disabled={!nama}
        >
          <span class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white  rounded-md group-hover:bg-opacity-0">
            capture
          </span>
        </button>
      </div>

      {loading && <Loading />}
    </div>
  );
};

export default CameraPage;
