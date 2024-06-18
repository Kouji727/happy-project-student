import { motion } from 'framer-motion'

const Backdrop2 = ({ children, onClick }) => {

    return (

        <motion.div 
            className='top-0 left-0 h-[100%] w-[100%] bg-[#000000e1] flex items-center justify-center z-50 fixed'
            onClick={onClick}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
        >
            {children}

        </motion.div>
    );

};

export default Backdrop2;