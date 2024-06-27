import { useEffect, useState, useCallback, useRef } from "react";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from '../components/AuthContext';
import { motion } from 'framer-motion';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  DocumentCheckIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  InboxIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";

import {
  BellAlertIcon
} from "@heroicons/react/24/solid";

import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  where,
  query,
  getDocs,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Spinner } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";

const auth = getAuth();
const db = getFirestore();

const initialNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, current: false },
  { name: "Clearance", href: "/student-clearance", icon: DocumentCheckIcon, current: false},
  { name: "Notification", href: "/notifications", icon: BellIcon, current: false},
  { name: "Messages", href: "/view-messages-student", icon: InboxIcon, current: false },
  { name: "Activity Log", href: "/activitylog", icon: ClipboardDocumentListIcon, current: false },
  { name: "Change Password", href: "/settings", icon: LockClosedIcon, current: false, children: [] },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function SidebarStudent({ children }) {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navigation, setNavigation] = useState(initialNavigation);
  const location = useLocation();
  const [notification, setNotification] = useState([]);
  const filteredItems = navigation.filter(item => item.name !== "Notification");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
      event.target.closest('.dropdown-toggle') === null
    ) {
      setDropdownOpen(false);    
    }
  };

  window.addEventListener('mousedown', handleClickOutside);

  return () => {
    window.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

  useEffect(() => {
    if (!currentUser) return;
  
    const notifCollectionRef = collection(db, 'studentNotification');
    const q = query(notifCollectionRef, where("studentId", "==", currentUser.uid));
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => doc.data());
      setNotification(notifications);
    });
  
    return () => unsubscribe();
  }, [currentUser]);  

  // Filter unread clearance requests
  const getUnreadNotification = useCallback(() => {
    if (!currentUser) {
      return [];
    }
    return notification.filter(request => request.studentId === currentUser.uid && !request.isRead);
  }, [currentUser, notification]);
  
  // DELETE THIS AND REPLACE WITH MANUAL
  // Generate Notification
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const clearanceCollectionRef = collection(db, 'clearanceRequests');
    const q = query(
      clearanceCollectionRef,
      where('studentId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const requestsData = [];
      const newNotifications = [];

      querySnapshot.forEach((doc) => {
        const requestData = { ...doc.data(), id: doc.id };
        if (requestData.status !== 'pending') {
          requestsData.push(requestData);
          newNotifications.push(requestData);
        }
      });

      const notificationsCollectionRef = collection(db, 'studentNotification');
      await Promise.all(newNotifications.map(async (item) => {
        
        const existingNotificationQuery = query(
          notificationsCollectionRef,
          where('studentId', '==', currentUser.uid),
          where('subject', '==', item.subject),
          where('timestamp', '==', item.timestamp)
        );

        const existingNotificationSnapshot = await getDocs(existingNotificationQuery);
        if (existingNotificationSnapshot.empty) {
          await addDoc(notificationsCollectionRef, {
            studentId: currentUser.uid,
            subject: item.subject,
            status: item.status,
            isRead: false,
            timestamp: item.timestamp,
            notifTimestamp: serverTimestamp(),
          });
        }
      }));
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userCollectionRef = collection(db, "users");
          const q = query(userCollectionRef, where("uid", "==", user.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            setUserEmail(userData.email);
            setUserRole(userData.role);
          }

          console.log("UID: ", user.uid);
          console.log("Role: ", userRole);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  }, [userRole]);

  // ADD INBOX HERE
  useEffect(() => {
    const updatedNavigation = initialNavigation.map((item) => {
      if (item.name === "Notification") {
        return {
          ...item,
          icon: getUnreadNotification().length > 0 ? BellAlertIcon : BellIcon,
          current: item.href === location.pathname,
        };
      } else {
        return {
          ...item,
          current: item.href === location.pathname,
        };
      }
    });
  
    setNavigation(updatedNavigation);
  }, [location.pathname, notification, getUnreadNotification]);

  const handleLogout = async () => {
    try {
      const auditLogsRef = collection(db, "auditLogs");
      await addDoc(auditLogsRef, {
        timestamp: serverTimestamp(),
        userId: currentUser.uid,
        actionType: "logout",
        email: currentUser.email,
      });

      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const getInitials = (email) => {
    if (!email) return "";
    const names = email.split("@")[0].split(/\.|_|-/);
    return names
      .map((n) => n[0].toUpperCase())
      .slice(0, 2)
      .join(""); // Get up to 2 initials
  };
  

  return (
    <>
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center h-screen">
            <Spinner size="xl" color="blue.500" />
          </div>
        ) : (
          <div>
            <Transition.Root show={sidebarOpen} as={Fragment}>
              <Dialog
                as="div"
                className="relative z-50 lg:hidden"
                onClose={setSidebarOpen}
              >
                <Transition.Child
                  as={Fragment}
                  enter="transition-opacity ease-linear duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition-opacity ease-linear duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="fixed inset-0 bg-gray-900/80" />
                </Transition.Child>

                <div className="fixed inset-0 flex">
                  <Transition.Child
                    as={Fragment}
                    enter="transition ease-in-out duration-300 transform"
                    enterFrom="-translate-x-full"
                    enterTo="translate-x-0"
                    leave="transition ease-in-out duration-300 transform"
                    leaveFrom="translate-x-0"
                    leaveTo="-translate-x-full"
                  >
                    <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                      <Transition.Child
                        as={Fragment}
                        enter="ease-in-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in-out duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                          <button
                            type="button"
                            className="-m-2.5 p-2.5"
                            onClick={() => setSidebarOpen(false)}
                          >
                            <span className="sr-only">Close sidebar</span>
                            <XMarkIcon
                              className="h-6 w-6 text-white"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </Transition.Child>
                      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-blue-300 px-6 pb-2">
                        <div className="flex h-16 shrink-0 items-center">
                          <img
                            className="h-10 w-auto"
                            src="https://dyci.edu.ph/img/DYCI.png"
                            alt="DYCI Logo"
                          />
                        </div>
                        {userRole && (
                          <nav className="flex flex-1 flex-col">
                            <ul className="flex flex-1 flex-col gap-y-7">
                              <li>
                                <ul className="-mx-2 space-y-1">
                                  {filteredItems.map((item) => (
                                    <li key={item.name}>
                                      <a
                                        href={item.href}
                                        className={classNames(
                                          item.current
                                            ? "bg-[#fff2c1] text-[#494124]"
                                            : "text-gray-700 hover:text-[#494124] hover:bg-[#fffbec]",
                                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                        )}
                                      >
                                        <item.icon
                                          className={classNames(
                                            item.current
                                              ? "text-[#494124]"
                                              : "text-gray-400 group-hover:text-[#494124]",
                                            "h-6 w-6 shrink-0"
                                          )}
                                          aria-hidden="true"
                                        />
                                        {item.name}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            </ul>
                          </nav>
                        )}
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </Dialog>
            </Transition.Root>

            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
              <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-blue-200 px-6">
                <div className="flex h-16 shrink-0 items-center">
                  <img
                    className="h-10 w-auto"
                    src="https://dyci.edu.ph/img/DYCI.png"
                    alt="DYCI Logo"
                  />
                </div>
                {userRole && (
                  <nav className="flex flex-1 flex-col">
                    <ul className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <a
                                href={item.href}
                                className={classNames(
                                  item.current
                                    ? "bg-[#fff2c1] text-[#494124]"
                                    : "text-gray-700 hover:text-[#494124] hover:bg-[#fffbec]",
                                  "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                )}
                              >
                                <item.icon
                                  className={classNames(
                                    item.current
                                      ? "text-[#494124]"
                                      : "text-gray-400 group-hover:text-[#494124]",
                                    "h-6 w-6 shrink-0"
                                  )}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </li>
                      <li className="-mx-6 mt-auto">
                        <div
                          className="relative"
                        >
                          <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-blue-300 w-full"
                          >
                            <span className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-600">
                              {getInitials(currentUser?.email || "User")}
                            </span>
                            <span className="sr-only">Your profile</span>
                            <span aria-hidden="true">
                              {currentUser?.email || "User"}{" "}
                            </span>{" "}
                          </button>
                          
                          {dropdownOpen && (
                            <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5"
                          >
                            <button
                              className="dropdown-toggle block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              onClick={handleLogout}
                            >
                              Logout
                            </button>
                          </motion.div>
                          )}
                        </div>
                      </li>
                    </ul>
                  </nav>
                )}
              </div>
            </div>

            {/* Sidebar Hidden */}
            <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-blue-300 px-4 py-4 shadow-sm sm:px-6 lg:hidden">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
                Dashboard
              </div>

              <a href="/notifications">
                <span className="sr-only">Notification</span>
                  <motion.div 
                  whileHover={{scale: 1.1, backgroundColor: '#eeeee4'}}
                  whileTap={{scale: 0.80}}
                  
                  className="flex items-center rounded-full p-1 text-sm font-semibold text-gray-800">
                    {getUnreadNotification().length > 0 ? (
                      <BellAlertIcon className="h-6 w-6 text-red-400" />
                    ) : (
                      <BellIcon className="h-6 w-6" />
                    )}
                </motion.div>
              </a>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center"
                >
                  <span className="sr-only">Your profile</span>
                  <span className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-600">
                    {getInitials(currentUser?.email || "User")}
                  </span>
                </button>
                {dropdownOpen && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5"
                  >
                    <button
                      onClick={handleLogout}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
            

            <main className="py-10 lg:pl-72 bg-white">
              <div className="px-4 sm:px-6 lg:px-8">{children}</div>
            </main>
          </div>
        )}
      </div>
    </>
  );
}
