import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { db, storage } from "../firebaseConfig";
import { motion, AnimatePresence } from 'framer-motion';
import ModalSubject from "../components/Modal/index";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc, 
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import SidebarStudent from "../components/SidebarStudent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../components/Modal";

const SPECIAL_SUBJECTS = [
  "Librarian",
  "Finance",
  "Director/Principal",
  "Basic Education Registrar",
  "Class Adviser",
  "Character Renewal Office",
];

const StudentClearance = () => {
  const { currentUser } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [classRequirements, setClassRequirements] = useState({});
  const [officeRequirements, setOfficeRequirements] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSubjectOffice, setSelectedSubjectOffice] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [clearanceRequests, setClearanceRequests] = useState({});
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState(false);
  const [subjectToResubmit, setSubjectToResubmit] = useState(null);


  // Fetch Student Data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!currentUser) return;

      try {
        const studentsRef = collection(db, "students");
        const q = query(studentsRef, where("uid", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const studentDoc = querySnapshot.docs[0];
          setStudentData(studentDoc.data());
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    fetchStudentData();
  }, [currentUser]);


  // Fetch Class Requirement based on section
  useEffect(() => {
    const fetchClassRequirements = async () => {
      if (!studentData || !studentData.section) return;

      try {
        const classesRef = collection(db, "classes");
        const classQuery = query(
          classesRef,
          where("sectionName", "==", studentData.section)
        );
        const classSnapshot = await getDocs(classQuery);

        if (!classSnapshot.empty) {
          const classData = classSnapshot.docs[0].data();
          setClassRequirements(classData.requirements || {});
        }
      } catch (error) {
        console.error("Error fetching class requirements:", error);
      }
    };

    fetchClassRequirements();
  }, [studentData]);


  // Fetch Office Requirements
  useEffect(() => {
    const fetchOfficeRequirements = async () => {
      try {
        const officeReqsRef = collection(db, "officeRequirements");
        const officeReqsSnapshot = await getDocs(officeReqsRef);
        setOfficeRequirements(officeReqsSnapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching office requirements:", error);
      }
    };

    fetchOfficeRequirements();
  }, []);


  // Clearance Requests by Student
  useEffect(() => {
    const unsubscribe = () => {
      if (!currentUser) return;
  
      try {
        const requestsRef = collection(db, "clearanceRequests");
        const q = query(requestsRef, where("studentId", "==", currentUser.uid));
  
        const unsubscribe = onSnapshot(q, (requestsSnapshot) => {
          const requestsData = {};
          requestsSnapshot.forEach((doc) => {
            const data = doc.data();
            requestsData[data.subject] = {
              status: data.status,
              id: doc.id,
              fileURLs: data.fileURLs,
            };
          });
          setClearanceRequests(requestsData);
        });
  
        // Cleanup the listener on component unmount
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching clearance requests:", error);
      }
    };
  
    // Call the function directly
    const unsubscribeFunction = unsubscribe();
  
    return () => {
      if (unsubscribeFunction) {
        unsubscribeFunction();
      }
    };
  }, [currentUser]);
  

    const [ modalSubject, setModalSubject] = useState(null)
    const handleSubjectClick = (subject) => {
      setModalSubject(subject);
      setSelectedSubject(selectedSubject === subject ? null : subject);
      console.log(selectedSubject)
      };

    const [ modalSubjectOffice, setModalSubjectOffice] = useState(null)
    const handleSubjectClickOffice = (subject) => {
      setModalSubjectOffice(subject);
      setSelectedSubjectOffice(selectedSubject === subject ? null : subject);
      console.log(selectedSubjectOffice)
      };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };


  //adjust this, add custom alert jecho!!!
  const handleRequestClearance = async (subject, type) => {

    if (!studentData || !subject) return;
  
    setIsUploading(true);
  
    try {
      const fileURLs = [];
  
      for (const file of files) {
        const storageRef = ref(
          storage,
          `clearance_requests/${currentUser.uid}/${subject}/${file.name}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        fileURLs.push(downloadURL);
      }
  
      const clearanceRequestsRef = collection(db, "clearanceRequests");
  
      if (type === 'class') {
        const subjectRequirements = classRequirements[subject];
        if (subjectRequirements && subjectRequirements.length > 0) {
          await addDoc(clearanceRequestsRef, {
            studentId: currentUser.uid,
            studentName: studentData.fullName,
            section: studentData.section,
            subject: subject,
            teacherUid: subjectRequirements[0].teacherUid,
            timestamp: serverTimestamp(),
            fileURLs: fileURLs,
            status: "pending",
          });
        } else {
          alert(
            "No requirements found for this subject. You do not need to request clearance."
          );
          return;
        }
      } else if (type === 'office') {
        const officeRequirement = officeRequirements.find(req => req.office === subject);
        if (officeRequirement) {
          await addDoc(clearanceRequestsRef, {
            studentId: currentUser.uid,
            studentName: studentData.fullName,
            section: studentData.section,
            subject: subject,
            office: officeRequirement.office,
            timestamp: serverTimestamp(),
            fileURLs: fileURLs,
            status: "pending",
          });
        } else {
          alert(
            "No requirements found for this office. You do not need to request clearance."
          );
          return;
        }
      }
  
      alert("Clearance requested successfully!");
      setSelectedSubject(null);
      setSelectedSubjectOffice(null);
      setFiles([]);
    } catch (error) {
      console.error("Error requesting clearance:", error);
      alert("Error requesting clearance. Please try again later.");
    } finally {
      setIsUploading(false);
    }
  };
  

  const openResubmitModal = (subject) => {
    setSubjectToResubmit(subject);
    setIsResubmitModalOpen(true);
  };

  const closeResubmitModal = () => {
    setSubjectToResubmit(null);
    setIsResubmitModalOpen(false);
  };

  const handleResubmitClearance = async (subject, type) => {
    closeResubmitModal();
  
    try {
      const requestToDelete = clearanceRequests[subject];
      if (requestToDelete) {
        await deleteDoc(doc(db, "clearanceRequests", requestToDelete.id));
      }
  
      await handleRequestClearance(subject, type);
    } catch (error) {
      console.error("Error resubmitting clearance:", error);
      alert("Error resubmitting clearance request. Please try again later.");
    }
  };
  

  const sortedSubjects = studentData?.clearance
  ? Object.keys(studentData.clearance).sort()
  : [];

  const regularSubjects = sortedSubjects.filter(
    (subject) => !SPECIAL_SUBJECTS.includes(subject)
  );

  const specialSubjects = sortedSubjects.filter((subject) =>
    SPECIAL_SUBJECTS.includes(subject)
  );

  return (
    <SidebarStudent>
            <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Student Clearance</h2>

        {/* Regular Subjects Table */}
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 border-b border-gray-200">Subject</th>
              <th className="py-2 border-b border-gray-200 text-center">
                Cleared
              </th>
              <th className="py-2 border-b border-gray-200">Details</th>
            </tr>
          </thead>
          <tbody>
            {regularSubjects.map((subject) => (
              <React.Fragment key={subject}>
                <tr>
                  <td
                    className="border px-4 py-2 cursor-pointer"
                    onClick={() => handleSubjectClick(subject)}
                  >
                    {subject}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {studentData.clearance[subject] ? (
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="text-green-500"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        className="text-red-500"
                      />
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    <motion.button
                      whileHover={{scale: 1.03}}
                      whileTap={{scale: 0.95}}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => handleSubjectClick(subject)}
                    >
                      View Details
                    </motion.button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Office Requirements Table */}
        {specialSubjects.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Office Requirements</h3>
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 border-b border-gray-200">
                    Office Names
                  </th>
                  <th className="py-2 border-b border-gray-200 text-center">
                    Cleared
                  </th>
                  <th className="py-2 border-b border-gray-200">Details</th>
                </tr>
              </thead>
              <tbody>

                {specialSubjects.map((office) => (
                  <React.Fragment key={office}>
                    <tr>
                      <td
                        className="border px-4 py-2 cursor-pointer"
                        onClick={() => handleSubjectClick(office)}
                      >
                        {office}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {studentData.clearance[office] ? (
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="text-green-500"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faTimesCircle}
                            className="text-red-500"
                          />
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        <motion.button
                          whileHover={{scale: 1.03}}
                          whileTap={{scale: 0.95}}
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={() => handleSubjectClickOffice(office)}
                        >
                          View Details
                        </motion.button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isResubmitModalOpen} onClose={closeResubmitModal}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Resubmit Clearance Request
          </h3>
          <p>
            Are you sure you want to resubmit your clearance request for{" "}
            <strong>{subjectToResubmit}</strong>? This will delete your previous
            request.
          </p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={closeResubmitModal}
              className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => handleResubmitClearance(subjectToResubmit)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Resubmit
            </button>
          </div>
        </div>
      </Modal>

      <AnimatePresence
        initial={false}
        mode="wait"
        onExitComplete={() => null}
        >
          {selectedSubject && (
            <ModalSubject modalOpen={selectedSubject} handleClose={() => handleSubjectClick(null)}>
                {/* Expandable Section for Requirements & Request */}
                {selectedSubject === modalSubject &&
                      classRequirements[modalSubject] ? (
                        <table>
                          <tbody>

                            <tr className="bg-gray-100">
                              <td colSpan={3} className="border px-4 py-2">
                                {/* Requirements List */}
                                <ul className="list-disc list-inside">
                                  {(classRequirements[modalSubject] || []).map(
                                    (requirement, index) => (
                                      <li key={index}>
                                        <strong>{requirement.name}:</strong>{" "}
                                        {requirement.description}
                                      </li>
                                    )
                                  )}
                                </ul>

                                {/* Request/Resubmit Clearance Section */}
                                <div className="mt-4">
                                  {clearanceRequests[modalSubject] ? (
                                    <div>
                                      <p className="mb-2">
                                        <FontAwesomeIcon
                                          icon={faExclamationCircle}
                                          className={
                                            clearanceRequests[modalSubject].status ===
                                            "approved"
                                              ? "text-green-500 mr-2"
                                              : "text-yellow-500 mr-2"
                                          }
                                        />
                                        Your clearance request is currently{" "}
                                        <strong
                                          className={
                                            clearanceRequests[modalSubject].status ===
                                            "approved"
                                              ? "text-green-500"
                                              : ""
                                          }
                                        >
                                          {clearanceRequests[modalSubject].status}
                                        </strong>
                                        .
                                      </p>

                                      {clearanceRequests[modalSubject].status !==
                                        "approved" && (

                                        <div className="items-center justify-center flex">
                                          <button
                                            onClick={() => openResubmitModal(modalSubject, 'class')}
                                            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                                            disabled={isUploading}
                                          >
                                            {isUploading
                                              ? "Resubmitting..."
                                              : "Resubmit Clearance"}
                                          </button>

                                        </div>

                                      )}

                                      {clearanceRequests[modalSubject].fileURLs &&
                                        clearanceRequests[modalSubject].fileURLs.length >
                                        0 ? (
                                        <div className="mt-2">
                                          <p className="text-sm font-medium text-gray-700">
                                            Submitted Files:
                                          </p>
                                          <ul>
                                            {clearanceRequests[
                                              modalSubject
                                            ].fileURLs.map((url, index) => (
                                              <li key={index}>
                                                <a
                                                  href={url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-blue-500 hover:underline"
                                                >
                                                  File {index + 1}
                                                </a>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Optional: Submit Files (e.g., proof of
                                        payment, documents)
                                      </label>
                                      <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                                      />
                                      <button
                                        onClick={() => handleRequestClearance(selectedSubject, 'class')}
                                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                        disabled={isUploading}
                                      >
                                        {isUploading
                                          ? "Requesting..."
                                          : "Request Clearance"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>

                          </tbody>
                        </table>
                      ):(
                        <div>
                          <p>
                            No Requirements
                          </p>
                          <p>
                            Button Here, inaantok na ko
                          </p>
                        </div>
                      )}
              
            </ModalSubject>
          )}


          {/* For Offices */}

          {selectedSubjectOffice && (
            <ModalSubject modalOpen={selectedSubjectOffice} handleClose={() => handleSubjectClickOffice(null)}>
                    {/* Expandable Section for Office Requirements & Request */}
                    {selectedSubjectOffice === modalSubjectOffice &&
                      officeRequirements.some(
                        (requirement) => requirement.office === modalSubjectOffice
                      ) ? (
                        <table>
                          <tbody>
                            <tr className="bg-gray-100">
                              <td colSpan={3} className="border px-4 py-2">
                                {/* Office Requirements List */}
                                <ul className="list-disc list-inside">
                                  {officeRequirements
                                    .filter(
                                      (requirement) => requirement.office === modalSubjectOffice
                                    )
                                    .map((requirement, index) => (
                                      <li key={index}>
                                        <strong>{requirement.name}:</strong>{" "}
                                        {requirement.description}
                                      </li>
                                    ))}
                                </ul>

                                {/* Request/Resubmit Clearance Section */}
                                <div className="mt-4">
                                  {clearanceRequests[modalSubjectOffice] ? (
                                    <div>
                                      <p className="mb-2">
                                        <FontAwesomeIcon
                                          icon={faExclamationCircle}
                                          className={
                                            clearanceRequests[modalSubjectOffice].status ===
                                            "approved"
                                              ? "text-green-500 mr-2"
                                              : "text-yellow-500 mr-2"
                                          }
                                        />
                                        Your clearance request is currently{" "}
                                        <strong
                                          className={
                                            clearanceRequests[modalSubjectOffice].status ===
                                            "approved"
                                              ? "text-green-500"
                                              : ""
                                          }
                                        >
                                          {clearanceRequests[modalSubjectOffice].status}
                                        </strong>
                                        .
                                      </p>
                                      {clearanceRequests[modalSubjectOffice].status !==
                                        "approved" && (
                                        <button
                                          onClick={() => openResubmitModal(modalSubjectOffice, 'office')}
                                          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                                          disabled={isUploading}
                                        >
                                          {isUploading
                                            ? "Resubmitting..."
                                            : "Resubmit Clearance"}
                                        </button>
                                      )}
                                      {clearanceRequests[modalSubjectOffice].fileURLs &&
                                      clearanceRequests[modalSubjectOffice].fileURLs.length >
                                        0 ? (
                                        <div className="mt-2">
                                          <p className="text-sm font-medium text-gray-700">
                                            Submitted Files:
                                          </p>
                                          <ul>
                                            {clearanceRequests[modalSubjectOffice].fileURLs.map(
                                              (url, index) => (
                                                <li key={index}>
                                                  <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:underline"
                                                  >
                                                    File {index + 1}
                                                  </a>
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Optional: Submit Files (e.g., proof of
                                        payment, documents)
                                      </label>
                                      <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                                      />
                                      <button
                                        onClick={() => handleRequestClearance(selectedSubjectOffice, 'office')}
                                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                        disabled={isUploading}
                                      >
                                        {isUploading
                                          ? "Requesting..."
                                          : "Request Clearance"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>

                          </tbody>
                        </table>
                      ):(
                        <div>
                        <p>
                          No Requirements
                        </p>
                        <p>
                          Button Here, inaantok na ko
                        </p>
                      </div>
                      )}
              
            </ModalSubject>
          )}


          
        
      </AnimatePresence>

    </SidebarStudent>
  );
};

export default StudentClearance;