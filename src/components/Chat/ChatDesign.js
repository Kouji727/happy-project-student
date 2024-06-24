import React, { useState, useEffect } from 'react';
import Backdrop from '../Backdrop'
import {
    PaperAirplaneIcon
  } from "@heroicons/react/24/solid";

const ChatDesign = ({ handleClose, children, subject, email }) => {
    const [message, setMessage] = useState('');
    const [isEmpty, setIsEmpty] = useState(true)

    const handleInputChange = (event) => {
        setMessage(event.target.value);
        autoResize(event.target);
    };

    const autoResize = (element) => {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;

        const maxHeight = 6 * parseFloat(getComputedStyle(element).lineHeight);
        if (element.scrollHeight > maxHeight) {
            element.style.height = `${maxHeight}px`;
            element.style.overflowY = 'auto';
        }
    };

    useEffect(() => {
        setIsEmpty(message === '');
    }, [message]);
    

  return (
    <Backdrop>
        <div className="bg-[#1d1c8b] w-[90%] sm:w-[60%] h-[90%] sm:h-[80%] flex flex-col p-2 rounded-lg">

            <div className="bg-[#5468b2] p-4 text-white text-xl font-bold flex justify-between items-center">
                <span>Inquiry: {subject}</span>
                <button className="bg-[#fce27c] text-[#7D703E] rounded-full w-10 h-10 flex justify-center items-center" onClick={handleClose}>
                    X
                </button>
            </div>

            <div className="bg-white flex-grow overflow-y-auto">
                <div className='pt-2'/>
                {children}
            </div>

            <div className="bg-[#5468b2] p-4 flex items-center">
                <textarea
                        className='w-full rounded-3xl px-3 py-2 items-center resize-none'
                        placeholder='Type your inquiry here...'
                        value={message}
                        onChange={handleInputChange}
                        rows={1}
                        style={{ maxHeight: 'calc(6 * var(--line-height))' }}
                    />

                {isEmpty ?(
                    <PaperAirplaneIcon className='ml-3 w-10 h-10 text-[#585858]'/>
                ):(

                    <PaperAirplaneIcon className='ml-3 w-10 h-10 text-[#fce27c] hover:cursor-pointer'/>
                )}

            </div>

        </div>


    </Backdrop>

  )
}

export default ChatDesign