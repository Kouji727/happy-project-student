import React, { useState, useEffect } from 'react'

const NotificationDesign = ({ type, subject}) => {
    const [typeS, setTypeS] = useState(null);

    useEffect(() => {
        if (type === 'approved') {
            setTypeS(true);
        } else if (type === 'rejected') {
            setTypeS(false);
        }
    }, [type]);

    return (
        <>
            {typeS !== null && (
                typeS ? (
                    <div className='bg-green-100 mx-4 my-3 p-5 rounded-md shadow-md'>
                        <p className='text-lg font-bold'>
                            Request Approved
                        </p>
                        <p>
                            Your request for <strong>{subject}</strong> was <strong>{type}</strong>
                        </p>
                    </div>
                ) : (
                    <div className='bg-red-100 mx-4 my-3 p-5 rounded-md shadow-md'>
                        <p className='text-lg font-bold'>
                            Request Rejected
                        </p>
                        <p>
                            Your request for <strong>{subject}</strong> was <strong>{type}</strong>
                        </p>
                    </div>
                )
            )}

        </>

    )
}

export default NotificationDesign
