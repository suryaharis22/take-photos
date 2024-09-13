
import WatermarkedImage from "@/components/WatermarkedImage";
import { IconDownload, IconHome } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Gallery = () => {
    const router = useRouter();
    const [pickedItems, setPickedItems] = useState([]);
    const items = Array.from({ length: 30 }, (_, index) => index + 1);

    useEffect(() => {
        console.log(pickedItems);
    }, [pickedItems]);

    const handlePickItem = (index) => {
        setPickedItems((prevPickedItems) => {
            if (prevPickedItems.includes(index)) {
                return prevPickedItems.filter((item) => item !== index);
            } else {
                return [...prevPickedItems, index];
            }
        });
    };

    return (
        <div className="container mx-auto p-2 h-screen">
            <div className="flex flex-wrap items-end justify-between bg-gray-100 p-2">
                <motion.button
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    onClick={() => router.push("/")}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-lg"
                >
                    <IconHome className="w-10 h-10" />
                </motion.button>
                {pickedItems.length > 0 && (
                    <motion.button
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-lg"
                    >
                        <IconDownload className="w-10 h-10" />
                    </motion.button>
                )}
            </div>
            <div className="flex flex-wrap justify-center h-full bg-gray-100 min-w-screen overflow-auto p-2 pb-20">
                {items.map((item) => (
                    <label
                        key={item}
                        htmlFor={`checkbox-${item}`}
                        className="relative w-44 h-44 bg-blue-500 m-2 rounded-md border-2 border-black"
                    >
                        <input
                            id={`checkbox-${item}`}
                            type="checkbox"
                            className="absolute top-2 left-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            onChange={() => handlePickItem(item)}
                            checked={pickedItems.includes(item)}
                        />
                        <WatermarkedImage imageUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHZqj-XReJ2R76nji51cZl4ETk6-eHRmZBRw&s" logoUrl="./logo.png" />
                    </label>
                ))}
            </div>
        </div>
    );
};

export default Gallery;
