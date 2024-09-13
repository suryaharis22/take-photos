// utils/triggerTraining.js
import axios from "axios";
import Swal from "sweetalert2";

export const triggerTraining = async (router) => {
    try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL_NGROK}trigger_training`, {
            trigger: true
        });

        setTimeout(() => router.push('/photo-result'), 5000);
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Gagal diproses. Silahkan coba lagi.',
            showConfirmButton: true,
            confirmButtonText: 'Back to home',
            confirmButtonColor: '#3b82f5',
        }).then((result) => {
            if (result.isConfirmed) {
                router.push('/');
            }
        });
    }
};
