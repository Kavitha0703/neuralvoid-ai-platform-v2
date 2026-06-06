export function formatTimeWithRelative(dateString: string | number | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let relativeStr = "just now";
  if (diffInSeconds >= 31536000) {
    const years = Math.floor(diffInSeconds / 31536000);
    relativeStr = `${years} year${years > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds >= 2592000) {
    const mnths = Math.floor(diffInSeconds / 2592000);
    relativeStr = `${mnths} month${mnths > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds >= 86400) {
    const days = Math.floor(diffInSeconds / 86400);
    relativeStr = `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds >= 3600) {
    const hours = Math.floor(diffInSeconds / 3600);
    relativeStr = `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds >= 60) {
    const minutes = Math.floor(diffInSeconds / 60);
    relativeStr = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds > 0) {
    relativeStr = `${diffInSeconds} second${diffInSeconds > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 0) {
    relativeStr = `in the future`;
  }
  
  const timeStr = date.toLocaleTimeString([], { hour12: false });
  return `${timeStr} (${relativeStr})`;
}
