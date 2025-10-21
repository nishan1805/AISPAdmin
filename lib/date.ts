export function formatDateTime(dateString: string): string {
  if (!dateString) return "-";

  const date = new Date(dateString);

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  const day = String(localDate.getDate()).padStart(2, "0");
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const year = String(localDate.getFullYear()).slice(-2);

  let hours = localDate.getHours();
  const minutes = String(localDate.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;
  const formattedHours = String(hours).padStart(2, "0");

  return `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
}
