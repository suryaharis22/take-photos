import {
  IconPhoto,
  IconPower,
  IconUpload,
  IconUserScan,
} from "@tabler/icons-react";
import axios from "axios";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const Start = () => {
  const router = useRouter();
  const [cameraError, setCameraError] = useState(null);
  const [cameraAccess, setCameraAccess] = useState(false);

  useEffect(() => {
    localStorage.clear();

    // Meminta izin akses kamera tanpa menyalakan kamera
    navigator.permissions
      .query({ name: 'camera' })
      .then((permission) => {
        if (permission.state === 'granted') {
          setCameraAccess(true);
        } else if (permission.state === 'prompt') {
          // Meminta izin
          navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
              // Tidak melakukan apa-apa dengan stream
              stream.getTracks().forEach(track => track.stop());
              setCameraAccess(true);
            })
            .catch((error) => {
              console.error("Error accessing camera:", error);
              setCameraError(
                "Tidak dapat mengakses kamera. Pastikan izin diberikan atau kamera terhubung."
              );
            });
        } else {
          setCameraError(
            "Tidak dapat mengakses kamera. Pastikan izin diberikan atau kamera terhubung."
          );
        }
      })
      .catch((error) => {
        console.error("Error checking camera permissions:", error);
        setCameraError(
          "Tidak dapat memeriksa izin kamera. Pastikan izin diberikan atau kamera terhubung."
        );
      });
  }, []);

  const handleScan = () => {
    if (cameraAccess) {
      Swal.fire({
        title: "Masukkan Nama Anda",
        input: "text",
        inputPlaceholder: "Nama",
        showCancelButton: true,
        confirmButtonText: "Submit",
        preConfirm: (name) => {
          if (!name) {
            Swal.showValidationMessage("Nama tidak boleh kosong");
          }
          return name;
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const name = result.value;
          router.push(`/faceid/${name}`);
        }
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Akses Kamera Ditolak',
        text: 'Tidak dapat melanjutkan tanpa akses kamera.',
      });
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-wrap items-end justify-end bg-gray-100 p-2">
        <motion.button
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 400, damping: 17 }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/gallery")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-lg"
        >
          <IconPhoto className="w-10 h-10" />
        </motion.button>
      </div>
      <div className="flex flex-wrap items-center justify-center min-h-screen bg-gray-100 p-10 min-w-screen">
        {cameraError ? (
          <div className="text-red-500 mb-4">{cameraError}</div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 400, damping: 17 }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="flex flex-col items-center m-2 md:m-4">
              <button
                onClick={handleScan}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-lg  w-[100px] h-[100px] flex items-center justify-center md:w-[300px] md:h-[300px]"
              >
                <IconUserScan className="w-10 h-10 md:w-40 md:h-40" />
              </button>
              <h1 className="text-2xl font-bold mb-6 text-center">Mulai</h1>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Start;
