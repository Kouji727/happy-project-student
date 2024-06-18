import React, { useEffect, useState } from 'react'

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
                <div className='bg-orange-500 max-w-[80%] '>
                    <div>
                        <p>
                            dmkcdcm
                        </p>
                    </div>
        
                </div>

            ):(
                <div>
        
                </div>
            )}
        
        </>
    )
}

export default UserChatDesign