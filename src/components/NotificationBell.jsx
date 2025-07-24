import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { BellIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(Date.now());

  const fetchNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data || []);

    // Find new ones
    const newOnes = (data || []).filter(
      n => !n.read && new Date(n.createdAt).getTime() > lastSeen
    );

    newOnes.forEach(n => {
      toast(n.message, {
        duration: 5000,
        icon: '🔔',
      });
    });

    if (newOnes.length > 0) setLastSeen(Date.now());
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    fetchNotifications();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-gray-100"
      >
        <BellIcon className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1.5">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-md shadow-xl z-50">
          <div className="p-3 border-b font-semibold text-gray-700">Notifications</div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <li className="p-4 text-gray-500 text-sm">No notifications</li>
            )}
            {notifications.map((n) => (
              <li key={n._id} className="p-3 border-b text-sm hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="text-gray-800">{n.message}</div>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      className="text-xs text-blue-500 underline ml-2"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
