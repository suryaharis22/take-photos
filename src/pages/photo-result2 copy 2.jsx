import Watermark from "@/components/Watermark";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { IconCash, IconDownload, IconHome } from "@tabler/icons-react";

const baseUrl = 'https://faceid.panorasnap.com/worker/matched_image/';
const logoUrl = '/logo.png';

export default function CardImages() {
  const router = useRouter();
  const [selectedImages, setSelectedImages] = useState([]);
  const [watermarkedImages, setWatermarkedImages] = useState([]);
  const [photos, setPhotos] = useState([]);


  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL_NGROK}get_matched_images`);
        const imageUrls = response.data.matched_images;
        setPhotos(imageUrls);

        const imgArray = await Promise.all(imageUrls.map(async (img) => {
          const imgSrc = `${baseUrl}${img}`;
          const watermarkedImg = await createWatermarkedImage(imgSrc);
          return watermarkedImg;
        }));

        setWatermarkedImages(imgArray);
      } catch (error) {
        console.error('Error fetching images:', error);
        Swal.fire('Error', 'Failed to load images.', 'error');
      }
    };

    fetchImages();
  }, []);

  const createWatermarkedImage = (src) => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.src = src;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0); // Gambar gambar asli

        // Gambar logo sebagai watermark
        const logo = new window.Image();
        logo.src = logoUrl;
        logo.onload = () => {
          const logoWidth = 100; // Ganti dengan ukuran logo yang diinginkan
          const logoHeight = (logo.height / logo.width) * logoWidth; // Menjaga rasio aspek

          // Hitung posisi logo di tengah
          const logoX = (img.width - logoWidth) / 2; // Posisi X logo
          const logoY = (img.height - logoHeight) / 2; // Posisi Y logo

          // Gambar logo di tengah
          ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

          // Resolve URL data dari gambar yang sudah diberi watermark
          resolve(canvas.toDataURL());
        };
      };

      img.onerror = () => {
        console.error('Error loading image:', src);
        resolve(src); // Kembalikan gambar asli jika gagal
      };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo({ ...paymentInfo, [name]: value });
  };


  const handleCheckboxChange = (image) => {
    setSelectedImages((prevSelectedImages) => {
      if (prevSelectedImages.includes(image)) {
        return prevSelectedImages.filter((img) => img !== image);
      } else {
        return [...prevSelectedImages, image];
      }
    });
  };

  const handleDownload = () => {
    Swal.fire({
      title: "Payment Gateway",
      html: `
        <div>
          <div class="mb-2 text-left">
            <label for="cardNumber" class="block mb-2 text-sm font-medium text-gray-900">Card Number</label>
            <input id="cardNumber" type="text" placeholder="Card Number" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>
          </div>
          <div class="mb-2 text-left">
            <label for="expiryDate" class="block mb-2 text-sm font-medium text-gray-900">Expiry Date (MM/YY)</label>
            <input id="expiryDate" type="text" placeholder="Expiry Date" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>
          </div>
          <div class="mb-2 text-left">
            <label for="cvv" class="block mb-2 text-sm font-medium text-gray-900">CVV</label>
            <input id="cvv" type="text" placeholder="CVV" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Pay Now",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const cardNumber = document.getElementById("cardNumber").value;
        const expiryDate = document.getElementById("expiryDate").value;
        const cvv = document.getElementById("cvv").value;

        if (!cardNumber || !expiryDate || !cvv) {
          Swal.showValidationMessage("Please fill out all fields.");
          return false;
        } else {
          setPaymentInfo({
            cardNumber,
            expiryDate,
            cvv,
            status: "success",
          });
          sessionStorage.setItem("paymentInfo", JSON.stringify(paymentInfo));
          sessionStorage.setItem(
            "selectedImages",
            JSON.stringify(selectedImages)
          );

          router.push("/my-photo");
        }
      },
    });
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header dengan tombol Home dan Download */}
      <div className="flex justify-between items-center mb-8">
        {/* Tombol Home */}
        <motion.button
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => router.push("/")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-lg"
        >
          <IconHome className="w-10 h-10" />
        </motion.button>
        {selectedImages.length > 0 && (
          <motion.button
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={handleDownload}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-lg"
          >
            <IconCash className="w-10 h-10" />
          </motion.button>
        )}
      </div>

      {/* Kontainer untuk card images */}
      {photos.length > 0 ? (
        <div className="overflow-y-auto h-screen pb-40 flex flex-wrap justify-center ">
          {photos.map((photo, index) => (
            <label
              htmlFor={`${photo}`}
              key={index}
              className="relative m-10 w-40 h-40 bg-white shadow-md rounded-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105 focus-within:scale-105"
            >
              <input
                type="checkbox"
                className="hidden peer"
                id={`${photo}`}
                onChange={() => handleCheckboxChange(photo)}
              />
              <img
                className="w-full h-full object-cover"
                src={`${process.env.NEXT_PUBLIC_API_URL_NGROK}/matched_image/${photo}`}
                alt={`${process.env.NEXT_PUBLIC_API_URL_NGROK}/matched_image/${photo}`}
              />
              {/* <Watermark imageUrl={`${process.env.NEXT_PUBLIC_API_URL_NGROK}matched_image/${photo}`} /> */}

              {/* Highlight checkbox if selected */}
              <div className="absolute inset-0 flex justify-center items-center bg-blue-500 bg-opacity-30 opacity-0 peer-checked:opacity-100 transition duration-300">
                <span className="text-white font-bold text-lg">Selected</span>
              </div>
            </label>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-400 text-lg">No images. Please scan again</p>
        </div>
      )}
    </div>
  );
}
