import React, { useEffect, useState } from 'react'
import "./chat.css";

const UserChatDesign = ({userType}) => {
    const [type, setType] = useState(null);

    useEffect(() => {
        if (userType === 'student') {
            setType(true);
        } else {
            setType(false);
        }
    }, [type]);

    return (
        <>
            {type ?(
                <>
                    <div className='flex items-center gap-3 ml-3 py-1'>
                        <div className='bg-[#1d1c8b] w-10 h-10 rounded-full'>

                        </div>

                        <div className='bg-[#ffeca4] max-w-[50%] sm:max-w-[60%] rounded-2xl justify-start items-center flex p-2 px-3'>
              
                                <p className='word-wrap w-full'>
                                testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttestvfgdfgdfgdfesttesttesttesttest
                                </p>
                    
                        </div>

                    </div>

                    <div className='flex items-center gap-3 mr-3 py-1 justify-end'>

                        <div className='bg-[#bcc9fb] max-w-[50%] sm:max-w-[60%] rounded-2xl justify-start items-center flex p-2 px-3'>
              
                                <p className='word-wrap w-full'>
                                testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttestvfgdfgdfgdfesttesttesttesttest
                                </p>
                    
                        </div>
                    </div>

                    <div className='flex items-center gap-3 ml-3 py-1'>
                        <div className='bg-[#1d1c8b] w-10 h-10 rounded-full'>

                        </div>

                        <div className='bg-[#ffeca4] max-w-[50%] sm:max-w-[60%] rounded-2xl justify-start items-center flex p-2 px-3'>
              
                                <p className='word-wrap w-full'>
                                testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttestvfgdfgdfgdfesttesttesttesttest
                                </p>
                    
                        </div>

                    </div>

                    <div className='flex items-center gap-3 mr-3 py-1 justify-end'>

                        <div className='bg-[#bcc9fb] max-w-[50%] sm:max-w-[60%] rounded-2xl justify-start items-center flex p-2 px-3'>
              
                                <p className='word-wrap w-full'>
                                testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttestvfgdfgdfgdfesttesttesttesttest
                                </p>
                    
                        </div>
                    </div>

                    <div className='flex items-center gap-3 ml-3 py-1'>
                        <div className='bg-[#1d1c8b] w-10 h-10 rounded-full'>

                        </div>

                        <div className='bg-[#ffeca4] max-w-[50%] sm:max-w-[60%] rounded-2xl justify-start items-center flex p-2 px-3'>
              
                                <p className='word-wrap w-full'>
                                testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttestvfgdfgdfgdfesttesttesttesttest
                                </p>
                    
                        </div>

                    </div>

                    <div className='flex items-center gap-3 mr-3 py-1 justify-end'>

                        <div className='bg-[#bcc9fb] max-w-[50%] sm:max-w-[60%] rounded-2xl justify-start items-center flex p-2 px-3'>
              
                                <p className='word-wrap w-full'>
                                testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttestvfgdfgdfgdfesttesttesttesttest
                                </p>
                    
                        </div>
                    </div>

                    <div className='flex items-center gap-3 ml-3 py-1'>
                        <div className='bg-[#1d1c8b] w-10 h-10 rounded-full'>

                        </div>

                        <div className='bg-[#ffeca4] max-w-[50%] sm:max-w-[60%] rounded-2xl justify-start items-center flex p-2 px-3'>
              
                                <p className='word-wrap w-full'>
                                testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttestvfgdfgdfgdfesttesttesttesttest
                                </p>
                    
                        </div>

                    </div>

                    <div className='flex items-center gap-3 mr-3 py-1 justify-end'>

                        <div className='bg-[#bcc9fb] max-w-[50%] sm:max-w-[60%] rounded-2xl justify-start items-center flex p-2 px-3'>
              
                                <p className='word-wrap w-full'>
                                testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttestvfgdfgdfgdfesttesttesttesttest
                                </p>
                    
                        </div>
                    </div>


                </>
            ):(
                <>
        
                </>
            )}
        
        </>
    )
}

export default UserChatDesign