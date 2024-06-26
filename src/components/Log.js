import React, { useState, useEffect } from 'react'

const Log = ({ type, subject, date }) => {
    const [typeS, setTypeS] = useState(null);

    useEffect(() => {
        if (type === 'submit') {
            setTypeS(true);
        } else if (type === 'resubmit') {
            setTypeS(false);
        }
    }, [type]);

    return (
        <>
            {typeS !== null && (
                typeS ? (
                    <div className='bg-blue-300 mx-4 my-3 p-5 rounded-md shadow-md'>
                        <p className='text-lg font-bold'>
                            Request Submission
                        </p>
                        <p>
                            Your request for <strong>{subject}</strong> was submitted on <strong>{date}</strong>
                        </p>
                    </div>
                ) : (
                    <div className='bg-yellow-100 mx-4 my-3 p-5 rounded-md shadow-md'>
                        <p className='text-lg font-bold'>
                            Request Resubmission
                        </p>
                        <p>
                            Your request for <strong>{subject}</strong> was resubmitted on <strong>{date}</strong>
                        </p>
                    </div>
                )
            )}

        </>

    )
}

export default Log
