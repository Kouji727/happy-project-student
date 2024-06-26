import { useEffect, useState, useCallback } from "react";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from '../components/AuthContext';
import { motion } from 'framer-motion';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  InboxIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";

import {
  BellAlertIcon
} from "@heroicons/react/24/solid";

import { getAuth, onAuthStateChanged } from "firebase/auth";
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
import { useLocation } from "react-router-dom";

const auth = getAuth();
const db = getFirestore();

const initialNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, current: false },
  { name: "Clearance", href: "/student-clearance", icon: DocumentDuplicateIcon, current: false},
  { name: "Notification", href: "/notifications", icon: BellIcon, current: false},
  { name: "Inbox", href: "/view-messages-student", icon: InboxIcon, current: false },
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
                        <a
                          className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-50"
                        >
                          <img
                            className="h-8 w-8 rounded-full bg-gray-50 object-cover"
                            src="https://images.unsplash.com/photo-1565945887714-d5139f4eb0ce?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Profile"
                          />
                          <span className="sr-only">Your profile</span>
                          <span aria-hidden="true">{userEmail}</span>
                        </a>
                        
                        
                      </li>
                      
                    </ul>
                  </nav>
                )}
              </div>
            </div>

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

              <a>
                <span className="sr-only">Your profile</span>
                <img
                  className="h-8 w-8 rounded-full bg-gray-50"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt=""
                />
              </a>
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
