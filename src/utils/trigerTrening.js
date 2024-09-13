// utils/triggerTraining.js
import axios from "axios";
import Swal from "sweetalert2";

export const triggerTraining = async (router) => {
    try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL_NGROK}trigger_training`, {
            trigger: true
        })
        if (response.status === 200) {
            Swal.fire({
                icon: 'success',
                title: 'Training Success',
                showConfirmButton: false,
                timer: 1500
            }).then((result) => {
                router.push('/photo-result')
            })
        }
        // setTimeout(() => router.push('/photo-result'), 5000);
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
