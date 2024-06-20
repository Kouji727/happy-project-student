import React, { useState } from 'react';
import Backdrop from '../Backdrop'

const ChatDesign = ({ handleClose, children }) => {
    const [message, setMessage] = useState('');

    const handleInputChange = (event) => {
        setMessage(event.target.value);
        autoResize(event.target); // Call autoResize to adjust textarea height
    };

    const autoResize = (element) => {
        element.style.height = 'auto'; // Reset height to auto to ensure it will grow with content
        element.style.height = `${element.scrollHeight}px`; // Set the height to match the scrollHeight (content height)

        // Limiting to maximum 6 rows
        const maxHeight = 3 * parseFloat(getComputedStyle(element).lineHeight);
        if (element.scrollHeight > maxHeight) {
            element.style.height = `${maxHeight}px`;
            element.style.overflowY = 'auto'; // Enable vertical scrollbar if needed
        }
    };

  return (
    <Backdrop>

        <div className='w-[95%] bg-red-500 h-[90%]'>
            <div className='w-[100%] sm:h-[85%] h-[80%] bg-green-300  overflow-auto'>
                <div className='flex justify-center h-full overflow-scroll'>
                    <div className='w-[100%]'>

                        {children}
                        
                    </div>

                </div>
            </div>


            <div className='absoulte bottom-0'>
                <div className='bg-blue-100 p-3'>
                    <textarea
                        className='w-full rounded-3xl px-3 py-2 items-center resize-none'
                        placeholder='Type your message here...'
                        value={message}
                        onChange={handleInputChange}
                        rows={1}
                        style={{ maxHeight: 'calc(6 * var(--line-height))' }}
                    />
                </div>
            </div>

        

            <div className='flex justify-center'>
                <button onClick={handleClose} className='bg-green-500 w-14 h-14 aspect-square flex rounded-full justify-center items-center'>
                    x
                </button>
            </div>


        </div>


    </Backdrop>

  )
}

export default ChatDesign