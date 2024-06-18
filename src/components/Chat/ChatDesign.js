import React from 'react'
import Backdrop from '../Backdrop'

const ChatDesign = ({ handleClose, children }) => {
  return (
    <Backdrop onClick={handleClose}>

        <div className='w-[100%] bg-white rounded-xl p-5'>
            <button onClick={handleClose} className='bg-green-500 w-7 h-5 aspect-square flex rounded-full justify-center items-center'>
                x
            </button>

            
            <div className='flex bg-red-300 justify-center'>
                <div className='bg-blue-300 w-[100%] h-[30vh]'>

                    {children}
                    
                </div>

            </div>
            


        </div>
    </Backdrop>

  )
}

export default ChatDesign