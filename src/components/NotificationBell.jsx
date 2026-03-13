import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { BellIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { getNotifications, markNotificationRead } from "../utils/api";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(Date.now());
  const bellRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data || []);

      const newOnes = (data || []).filter(
        (notification) =>
          !notification.read &&
          new Date(notification.createdAt).getTime() > lastSeen
      );

      newOnes.forEach((notification) => {
        toast(notification.message, {
          duration: 5000,
          icon: "🔔",
        });
      });

      if (newOnes.length > 0) {
        setLastSeen(Date.now());
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  }, [lastSeen]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification._id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const handleOpenNotification = async (notification) => {
    const link = notification.link?.trim();

    if (!notification.read) {
      try {
        await markNotificationRead(notification._id);
      } catch (error) {
        console.error("Failed to mark notification as read", error);
      }

      setNotifications((currentNotifications) =>
        currentNotifications.map((currentNotification) =>
          currentNotification._id === notification._id
            ? { ...currentNotification, read: true }
            : currentNotification
        )
      );
    }

    if (!link) {
      return;
    }

    setIsOpen(false);

    if (/^https?:\/\//i.test(link)) {
      window.location.assign(link);
      return;
    }

    navigate(link);
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/70 text-ink-700 shadow-soft transition hover:bg-white"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[1.35rem] rounded-full bg-clay-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 z-50 w-[22rem] overflow-hidden rounded-[24px] border border-white/80 bg-white/96 shadow-luxe backdrop-blur-xl">
          <div className="border-b border-ink-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
                  Alerts
                </p>
                <h3 className="mt-1 text-base font-semibold text-ink-900">
                  Notifications
                </h3>
              </div>
              <div className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600">
                {unreadCount} unread
              </div>
            </div>
          </div>

          <ul className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-ink-500">
                No notifications right now.
              </li>
            )}

            {notifications.map((notification) => (
              <li
                key={notification._id}
                className="border-b border-ink-100/80 px-5 py-4 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${
                      notification.read ? "bg-ink-200" : "bg-verdigris-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-6 text-ink-800">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-ink-400">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {notification.link ? (
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      className="rounded-full bg-verdigris-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-verdigris-700 transition hover:bg-verdigris-100"
                    >
                      Open
                    </button>
                  ) : !notification.read ? (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(notification._id)}
                      className="rounded-full bg-verdigris-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-verdigris-700 transition hover:bg-verdigris-100"
                    >
                      Read
                    </button>
                  ) : null}
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
