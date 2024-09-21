import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@tensorflow-models/facemesh";
import Webcam from "react-webcam";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { useRouter } from "next/router";
import Loading from "@/components/Loading";

function FaceId({ initialNameUser }) {
  const router = useRouter();
  const NameUser = router.query.name || initialNameUser;

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [dataFace, setDataFace] = useState(null);
  const [faceInFrame, setFaceInFrame] = useState(false);
  const [distanceValid, setDistanceValid] = useState(false);
  const [angleValid, setAngleValid] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const validateFaceData = () => {
    if (!dataFace) return;

    const bottomRight = dataFace[0]?.boundingBox?.bottomRight;
    const topLeft = dataFace[0]?.boundingBox?.topLeft;
    const noseTip = dataFace[0]?.annotations?.noseTip[0];
    const leftCheek = dataFace[0]?.annotations?.leftCheek[0];
    const rightCheek = dataFace[0]?.annotations?.rightCheek[0];

    if (bottomRight && topLeft) {
      const distance = Math.sqrt(
        Math.pow(bottomRight[0] - topLeft[0], 2) +
        Math.pow(bottomRight[1] - topLeft[1], 2)
      );
      setDistanceValid(distance >= 400 && distance <= 500);
    }

    if (noseTip && leftCheek && rightCheek) {
      const cheekDifference = Math.abs(leftCheek[2] - rightCheek[2]);
      setAngleValid(cheekDifference <= 3);

      const boxX = (canvasRef.current.width - 200) / 2;
      const boxY = (canvasRef.current.height - 200) / 2;
      const [noseX, noseY] = [noseTip[0], noseTip[1]];

      setFaceInFrame(
        noseX > boxX && noseX < boxX + 200 && noseY > boxY && noseY < boxY + 200
      );
    }
  };

  useEffect(() => {
    if (dataFace) validateFaceData();
  }, [dataFace]);

  useEffect(() => {
    if (faceInFrame && distanceValid && angleValid && images.length === 0) {
      capturePhoto();
      setLoading(true);
    }
  }, [faceInFrame, distanceValid, angleValid]);

  const capturePhoto = () => {
    if (webcamRef.current?.getScreenshot) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImages((prev) => [...prev, imageSrc]);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to capture image",
          text: "Please try again.",
        });
      }
    }
  };

  const uploadFile = async (image) => {
    try {
      const binaryString = atob(image.split(",")[1]);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("name", NameUser);
      formData.append("image", blob, `${Date.now()}.jpeg`);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL_NGROK}upload_masters`,
        formData
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Upload successful",
          text: "Data uploaded",
        });
        setLoading(false);
        setImages([]);
        router.push(`/photo-result2`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Swal.fire({
        icon: "error",
        title: "Upload failed",
        text: "Please try again.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (images.length > 0) {
      uploadFile(images[0]);
    }
  }, [images]);

  const runFacemesh = async () => {
    const net = await facemesh.load({
      inputResolution: { width: 640, height: 480 },
      scale: 0.8,
    });
    setInterval(() => detect(net), 100);
  };

  const detect = async (net) => {
    if (webcamRef.current?.video.readyState === 4) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const face = await net.estimateFaces(video);

      setDataFace(face);

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, videoWidth, videoHeight);
      }
    }
  };

  useEffect(() => {
    runFacemesh();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {loading ? (
        <Loading />
      ) : (
        <div className="relative w-full max-w-md">
          {!dataFace && (
            <div
              className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center p-4 font-bold bg-black  w-full h-full rounded-lg "
              style={{
                zIndex: 7,
              }}
            >
              <img
                src="/loading.gif"
                alt="Loading..."
                className="opacity-100"
                width={250}
                height={250}
              />
            </div>
          )}
          <Webcam
            ref={webcamRef}
            mirrored
            className="rounded-lg shadow-md w-full"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
          />
          {!faceInFrame && (
            <p className="text-sm font-semibold text-red-500 absolute top-0">
              Position your face in the box
            </p>
          )}
          {!distanceValid && (
            <p className="text-sm font-semibold text-red-500 absolute top-4">
              Incorrect distance to the camera
            </p>
          )}
          {!angleValid && (
            <p className="text-sm font-semibold text-red-500 absolute top-8">
              Face not aligned correctly
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const { name } = context.query;

  return {
    props: {
      initialNameUser: name || "",
    },
  };
}

export default FaceId;
