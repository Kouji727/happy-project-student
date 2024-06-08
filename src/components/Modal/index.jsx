import { motion } from 'framer-motion';
import Backdrop from '../Backdrop';
import './modal.css';

const dropIn = {
    hidden: {
        y: '-100vh',
        opacity: 0,
    },
    visible: {
        y: '0',
        opacity: 1,
        transition: {
            duration: 0.1,
            type: 'spring',
            damping: 25,
            stiffness: 500
        }
    },
    exit: {
        y: '100vh',
        opacity: 0,
    }
}

const ModalSubject = ({ handleClose, text }) => {

    return (
        <Backdrop onClick={handleClose}>

            <motion.div
                onClick={(e) => e.stopPropagation()}
                className='modal bg-white'
                variants={dropIn}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <button onClick={handleClose} className='bg-blue-100 px-[20%] z-50 absolute bottom-[10%] rounded-md'>
                    Close
                </button>
            </motion.div>

        </Backdrop>

    )

};

export default ModalSubject;