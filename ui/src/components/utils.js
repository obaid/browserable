function readableDate(data) {
  // April 4, 2025 12:00:00 AM
  const date = new Date(data);
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });

  return date;
}

export { readableDate };
