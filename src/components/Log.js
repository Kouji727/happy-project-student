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
                    <div className='bg-blue-100 mx-4 my-3 p-5 rounded-md'>
                        <p className='text-lg font-bold'>
                            Request Submission
                        </p>
                        <p>
                            You submitted a request for <strong>{subject}</strong> at <strong>{date}</strong>
                        </p>
                    </div>
                ) : (
                    <div className='bg-yellow-100 mx-4 my-3 p-5 rounded-md'>
                        <p className='text-lg font-bold'>
                            Request Resubmission
                        </p>
                        <p>
                            You resubmitted a request for <strong>{subject}</strong> at <strong>{date}</strong>
                        </p>
                    </div>
                )
            )}

        </>

    )
}

export default Log
