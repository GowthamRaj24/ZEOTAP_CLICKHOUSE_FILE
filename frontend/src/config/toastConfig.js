import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Standard toast configuration for the entire application
 * All toast notifications will use these settings for consistent appearance
 */
export const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
  style: {
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    fontSize: '0.875rem',
    padding: '12px 16px',
  }
};

/**
 * Toast Container configuration for App.jsx
 * This ensures all ToastContainer props match the individual toast settings
 */
export const containerConfig = {
  position: toastConfig.position,
  autoClose: toastConfig.autoClose,
  hideProgressBar: toastConfig.hideProgressBar,
  closeOnClick: toastConfig.closeOnClick,
  pauseOnHover: toastConfig.pauseOnHover,
  draggable: toastConfig.draggable,
  theme: toastConfig.theme,
  newestOnTop: true,
};

/**
 * Helper functions for showing toast notifications
 * Use these instead of direct toast calls for consistency
 */
export const notify = {
  success: (message) => toast.success(message, toastConfig),
  error: (message) => toast.error(message, toastConfig),
  info: (message) => toast.info(message, toastConfig),
  warning: (message) => toast.warning(message, toastConfig),
};

export default notify; 