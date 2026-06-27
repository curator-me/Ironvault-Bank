import client from '../api/client';

/**
 * Downloads a file from a backend endpoint that returns a blob.
 *
 * @param {string} url       - Endpoint path (relative to api/client baseURL).
 * @param {string} filename  - Filename to suggest in the browser download dialog.
 * @returns {Promise<void>}
 */
export const downloadFile = async (url, filename) => {
  const res = await client.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data]);
  const objectUrl = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
};
