import { IconCircleX, IconPhotoScan } from "@tabler/icons-react";
import axios from "axios";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const Upload = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setImages([...images, ...imageUrls]);
  };

  const handleRemoveImage = (e, indexToRemove) => {
    e.preventDefault();
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    const formData = new FormData();

    const promises = images.map(async (imageUrl, index) => {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const uniqueName = `image-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}.jpg`;
      formData.append("image", blob, uniqueName);
    });

    setLoading(true);

    await Promise.all(promises);

    axios
      .post(`${process.env.NEXT_PUBLIC_API_URL_NGROK}upload_assets`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        Swal.fire({
          icon: "success",
          title: "Upload Success",
          showConfirmButton: false,
          timer: 1500,
        });
        setImages([]);
        setLoading(false);
      })
      .catch((err) => {
        Swal.fire({
          icon: "error",
          title: `Failed`,
          text: `upload failed, please try again.`,
          showConfirmButton: true,
          //   timer: 1500,
        });
        setImages([]);
        setLoading(false);
      });
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-10 bg-gray-50">
      {/* Tampilkan spinner saat loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
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

      <div className="">
        <motion.label
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }} // Delay animasi tiap card agar berurutan
          whileHover={{ scale: 1.1 }} // Animasi saat di-hover
          htmlFor="uploadFile"
          className="hover:bg-gray-100 bg-white rounded-lg w-[300px] md:w-[400px] h-[250px] md:h-[250px] flex flex-col p-4 border border-gray-500 border-dashed transition-all duration-300 ease-in-out cursor-pointer relative"
        >
          <input
            type="file"
            id="uploadFile"
            className="absolute inset-0 opacity-0 cursor-pointer"
            multiple
            onChange={handleChange}
          />
          <p className="text-black font-bold text-lg text-center">
            Upload File
          </p>
          <p className="text-gray-400 text-sm text-center">
            Click to select files
          </p>

          {images.length > 0 ? (
            <motion.div
              className="flex flex-wrap w-full justify-center items-center gap-2 p-3 mt-4 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {images.map((image, index) => (
                <motion.div
                  key={index}
                  className="relative w-20 h-20"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <IconCircleX
                    size={20}
                    className="absolute top-1 right-1 text-red-500 cursor-pointer z-10 bg-white rounded-full"
                    onClick={(e) => handleRemoveImage(e, index)}
                  />
                  <Image
                    src={image}
                    alt={`upload-preview-${index}`}
                    width={100}
                    height={100}
                    className="w-20 h-20 bg-gray-200 rounded-lg object-cover"
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <IconPhotoScan size={40} className="text-blue-500" />
              <p className="text-gray-400 text-sm text-center">
                No files selected
              </p>
            </div>
          )}
        </motion.label>
        <motion.button
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={handleUpload}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg px-6 py-1 shadow-md hover:shadow-lg transition duration-300 my-2"
        >
          Upload
        </motion.button>
      </div>
    </div>
  );
};

export default Upload;
