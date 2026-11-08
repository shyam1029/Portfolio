/** Join a path onto the site's base URL ("/Portfolio") without doubled slashes. */
export const withBase = (path = '') =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
