export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Admin/Staff PIN auth
export const ADMIN_PIN_COOKIE = 'pizza_admin_pin';
export const DEFAULT_ADMIN_PIN = '1234'; // Default PIN, can be changed via env ADMIN_PIN
export const DEFAULT_KITCHEN_PIN = '5678';
export const DEFAULT_RIDER_PIN = '9999';
