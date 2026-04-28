import quotes from "@/data/quotes";

function getDailyQuote() {
  const now = new Date();
  const ISTOffset = 5.5 * 60 * 60 * 1000; // +5h30m in milliseconds
  const ISTTime = new Date(now.getTime() + ISTOffset);

  // Extract IST calendar date using UTC methods on the offset-adjusted time
  const year = ISTTime.getUTCFullYear();
  const month = ISTTime.getUTCMonth();
  const day = ISTTime.getUTCDate();

  // Stable day number = days elapsed since Unix epoch at IST midnight
  const ISTMidnight = Date.UTC(year, month, day);
  const dayNumber = Math.floor(ISTMidnight / 86400000);

  const index = dayNumber % quotes.length;
  return quotes[index];
}

export { getDailyQuote };
