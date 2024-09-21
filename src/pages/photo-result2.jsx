import Watermark from "@/components/Watermark";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { IconCash, IconDownload, IconHome } from "@tabler/icons-react";

const CardImages = () => {
  const router = useRouter();
  const [selectedImages, setSelectedImages] = useState([]);
  const [photos, setPhotos] = useState([]);
  // const { matches } = router.query;
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL_NGROK}get_matched_images`)
      .then((res) => {
        setPhotos(res.data.matched_images);
        // setLoading(false);
      })
      .catch((err) => {
        setPhotos([]);
        // setLoading(false);
      });
  }, []);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto h-screen pb-40">
          {photos.map((photo, index) => (
            <label
              htmlFor={`${photo}`}
              key={index}
              className="relative w-40 h-40 bg-white shadow-md rounded-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105 focus-within:scale-105"
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
};

export default CardImages;
