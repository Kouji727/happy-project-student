import React, { useEffect, useState } from 'react'
import "./chat.css";
import {
    DocumentMagnifyingGlassIcon
  } from "@heroicons/react/24/solid";

const UserChatDesign = ({userType, children, data}) => {
    const [type, setType] = useState(null);

    useEffect(() => {
        setType(userType === 'student');
    }, [userType]);

    return (
        <>
            {type ?(
                <>
                    <div className='flex items-center gap-3 mr-3 py-1 justify-end'>

                        <div className='bg-[#bcc9fb] max-w-[60%] sm:max-w-[60%] rounded-2xl justify-start items-center flex p-2 px-3'>
              
                                <div className='word-wrap w-full'>
                                    {data && data.fileURLs && data.fileURLs.map((url, index) => (
                                        <div key={index} className='pb-2'>
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#1d1c8b] hover:underline flex items-center"
                                                >
                                                <DocumentMagnifyingGlassIcon className='w-7 h-7'/>


                                                    File {index + 1}
                                                </a>
                                        </div>
                                    ))}
                                    
                                    {children}
                                </div>
                        </div>
                    </div>
                </>
            ):(
                <>

                <div className=' ml-3 '>
                    <div className='ml-14'>
                        
                        <span>
                            {data.facultyEmail}
                        </span>
                    </div>

                    <div className='flex gap-3 py-1'>
                        <div className='bg-[#1d1c8b] w-10 h-10 rounded-full'>

                        </div>
                        <div className='bg-[#ffeca4] max-w-[60%] sm:max-w-[60%] rounded-2xl justify-start items-center flex p-2 px-3'>
                                <div className='word-wrap w-full'>

                                    {data && data.fileURLs && data.fileURLs.map((url, index) => (
                                        <div key={index} className='pb-2'>
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#494124] hover:underline flex items-center"
                                                >
                                                <DocumentMagnifyingGlassIcon className='w-7 h-7'/>


                                                    File {index + 1}
                                                </a>
                                        </div>
                                    ))}
                                    {children} 
                                </div>
                        </div>
                    </div>
                </div>
                </>
            )}
        
        </>
    )
}

export default UserChatDesign