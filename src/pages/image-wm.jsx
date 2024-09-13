import WatermarkedImage from "@/components/WatermarkedImage";


const Page = () => {
    return (
        <div>
            <h1>Gambar dengan Watermark Logo</h1>
            <div className="w-40 h-40">

                <WatermarkedImage imageUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHZqj-XReJ2R76nji51cZl4ETk6-eHRmZBRw&s" logoUrl="./logo.png" />
            </div>
        </div>
    );
};

export default Page;
