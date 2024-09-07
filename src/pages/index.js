import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

const CameraPage = () => {
  const [videoSrc, setVideoSrc] = useState(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front, 'environment' for back
  const [error, setError] = useState(null); // State for handling errors
  const [countdown, setCountdown] = useState(null); // State for countdown
  const [loading, setLoading] = useState(false); // State for loading
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();

  // Function to start the video stream
  const startVideo = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      }
      setError(null); // Clear any previous errors

      // Start countdown after video is ready
      setTimeout(() => {
        startCountdown(3); // Start countdown from 3 seconds
      }, 1000); // Delay to ensure video is loaded

    } catch (err) {
      console.error('Error accessing camera: ', err);
      setError('Tidak dapat mengakses kamera. Pastikan kamera diaktifkan dan izinkan akses kamera. Jika akses kamera telah ditolak, Anda mungkin perlu mengatur ulang izin browser.');
    }
  };

  // Function to start countdown smoothly
  const startCountdown = (duration) => {
    let start = null;
    let timeRemaining = duration;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = (timestamp - start) / 1000;
      const newTimeRemaining = Math.max(duration - Math.floor(elapsed), 0);
      setCountdown(newTimeRemaining);

      if (newTimeRemaining > 0) {
        requestAnimationFrame(step);
      } else {
        capturePhoto(); // Capture photo when countdown finishes
      }
    };

    requestAnimationFrame(step);
  };

  // Function to capture a photo and handle redirection
  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoURL = canvas.toDataURL('image/jpeg');
      setVideoSrc(photoURL);

      // Save the single photo to localStorage
      localStorage.setItem('capturedPhotos', JSON.stringify([photoURL]));

      // Set loading state and redirect after 5 seconds
      setLoading(true);
      setTimeout(() => {
        router.push('/photo-result');
      }, 5000); // 5 seconds delay
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  useEffect(() => {
    startVideo();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  return (
    <div className="container mx-auto p-4 h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">Ambil Foto</h1>
      <div className="relative flex flex-col items-center">
        {error ? (
          <div className="text-red-500 mb-4 text-center">
            <p>{error}</p>
            <button onClick={() => startVideo()} className="mt-4 bg-yellow-500 text-white py-2 px-4 rounded transition-transform duration-300 transform hover:scale-105">
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="border border-gray-400 rounded-lg shadow-lg w-full max-w-md h-auto" autoPlay></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div className="absolute inset-0 flex items-center justify-center">
              {countdown > 0 && (
                <motion.div
                  className="text-white text-6xl font-bold"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {Math.ceil(countdown)}
                </motion.div>
              )}
            </div>
            <div className="mt-4">
              <button onClick={switchCamera} className="bg-green-500 text-white py-2 px-4 rounded transition-transform duration-300 transform hover:scale-105">
                Ganti Kamera
              </button>
            </div>


          </>
        )}
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 h-screen">
          <div role="status" className="flex flex-col items-center ">
            <svg aria-hidden="true" className="w-52 h-50 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export default CameraPage;
