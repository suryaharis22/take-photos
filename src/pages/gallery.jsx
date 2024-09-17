import Loading from "@/components/Loading";
import { IconDownload, IconHome } from "@tabler/icons-react";
import axios from "axios";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Gallery = () => {
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL_NGROK}get_all_images`);
        setLoading(false);
        setImages(response.data.all_images);
      } catch (err) {
        console.log(err);
      }
    };

    fetchImages();
  }, []);

  return (
    <div className="container mx-auto p-4 h-screen">
      <div className="flex flex-wrap items-center justify-between bg-gray-100 p-4 mb-4 rounded-lg shadow-md">
        <motion.button
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => router.push("/")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-lg flex items-center"
        >
          <IconHome className="w-6 h-6 mr-2" />
          Home
        </motion.button>
      </div>

      <div className="flex flex-col items-center h-full bg-gray-100 overflow-auto p-4 rounded-lg shadow-md ">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 w-full mb-40">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative w-full h-44 bg-blue-500 rounded-md overflow-hidden border-2 border-black"
            >
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL_NGROK}all_image/${image}`}
                className="w-full h-full object-cover"
                alt={`Image ${index + 1}`}
              />
            </div>
          ))}
        </div>
        {loading && <Loading />}
      </div>
    </div>
  );
};

export default Gallery;
